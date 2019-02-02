const fs = require('fs');
const snoowrap = require('snoowrap');
const axios = require('axios');

// Static for subreddit
const config = require('./config');
const checkInterval = config.checkInterval * 60 * 1000;

const reddit = new snoowrap(config.oauthDetails);

reddit.config({
    continueAfterRatelimitError: true,
    requestDelay: 100
});

let lastSeenText = '{}';

try {
    lastSeenText = fs.readFileSync('./last_seen.json');
} catch (err) {
    console.log('No last seen json. first time starting?');
}

// Read mod comments we monitor
let lastSeen = {};

try {

    lastSeen = JSON.parse(lastSeenText);
}
catch (err) {
    console.error('There has been an error parsing your JSON.');
    console.error(err);
}

function writeSeen(callback) {
    const writeData = JSON.stringify(lastSeen);
    fs.writeFile('./last_seen.json', writeData, err => {
        if (err) {
            console.error('There has been an error saving the last seen data.');
            console.error(err.message);
            return;
        }

        if(callback) {
            return callback();
        }
    });
}

function handleSlackAttachements(slackAttachements, hookDetails) {
    const sendAttachements = slackAttachements.splice(0, 10);

    axios.post(hookDetails.webhook, {attachments: sendAttachements}).catch(error => {
        console.log('webhook error', error);
    });
    if(slackAttachements.length) {
        handleSlackAttachements(slackAttachements, hookDetails);
    }
}

function makeSlackAttachement(subreddit, submission) {
    const attachment = {
        title: submission.title,
        title_link: `https://www.reddit.com${submission.permalink}`,
        author_name: `New post from /u/${submission.author.name}`,
        author_link: `https://reddit.com/user/${submission.author.name}`,
        footer: `In /r/${subreddit.name}`
    };

    if(subreddit.iconUrl) {
        attachment['footer_icon'] = subreddit.iconUrl;
    }

    if(subreddit.color) {
        attachment['color'] = subreddit.color;
    }

    return attachment;

}

function handleDiscordEmbeds(discordEmbeds, hookDetails) {
    const sendEmbeds = discordEmbeds.splice(0, 10);

    axios.post(hookDetails.webhook, {embeds: sendEmbeds}).catch(error => {
        console.log('webhook error', error);
    });
    if(discordEmbeds.length) {
        handleDiscordEmbeds(discordEmbeds, hookDetails);
    }
}

function makeDiscordEmbed(subreddit, submission) {
    const embed = {
        title: submission.title,
        url: `https://www.reddit.com${submission.permalink}`,
        description: `in /r/${subreddit.name}`,
        author: {
            name: `New post from /u/${submission.author.name}`,
            url: `https://reddit.com/user/${submission.author.name}`
        }
    };

    if(subreddit.iconUrl) {
        embed.author['icon_url'] = subreddit.iconUrl;
    }

    if(subreddit.color) {
        let color = subreddit.color.replace('#', '0x');
        color = parseInt(color);
        embed['color'] = color;
    }

    return embed;
}

// check subreddit
function subredditCheck(subreddit) {
    let discordEmbeds = [];
    let slackAttachements = [];

    reddit.getSubreddit(subreddit.name).getNew({
        limit: 100
    }).then(submissions => {
        submissions.forEach(submission => {
            if(!lastSeen[subreddit.name].includes(submission.name)) {

                // We really don't need to keep that many posts around.
                if (lastSeen[subreddit.name].length > 100) {
                    lastSeen[subreddit.name].shift();
                }

                lastSeen[subreddit.name].push(submission.name);

                if(subreddit.slackHooks && subreddit.slackHooks.length) {
                    // handle slack hooks.
                    slackAttachements.push(makeSlackAttachement(subreddit, submission));
                }

                if(subreddit.discordHooks && subreddit.discordHooks.length) {
                    // handle discord hooks.

                    discordEmbeds.push(makeDiscordEmbed(subreddit, submission));
                }

            }

        });

        // Let's check if we have stuff to send out
        if(discordEmbeds.length) {
            subreddit.discordHooks.forEach((hook) => {
                handleDiscordEmbeds(discordEmbeds, {webhook : hook});
            });
        }

        if(slackAttachements.length) {
            subreddit.slackHooks.forEach((hook) => {
                handleSlackAttachements(slackAttachements, {webhook : hook});
            });
        }

    }).catch(err => {
        return console.error(`error getting ${subreddit.name}`, err);
    });
}

function checkSubs() {
    writeSeen();
    config.monitorSubs.forEach((subreddit) => {
        if(!Object.keys(lastSeen).includes(subreddit.name)) {
            lastSeen[subreddit.name] = [];
        }
        subredditCheck(subreddit);
    });
    setTimeout(checkSubs, checkInterval);
}

checkSubs();
// On quit we first write back the lastSeen object to json.
process.on('SIGINT', function() {
    console.log('\nGracefully shutting down from SIGINT (Ctrl-C)');

    writeSeen(() => {
        process.exit();
    });
});