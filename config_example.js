module.exports = {
    oauthDetails: { // Use https://github.com/not-an-aardvark/reddit-oauth-helper and https://www.reddit.com/prefs/apps/ create a "personal use script" and fill in the details below.
        userAgent: '',
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: '',
    },
    checkInterval: 2, // In minutes
    monitorSubs: [
        {
            name: 'subreddit',
            color: '#FF0011', // Must be a hex value.
            iconUrl: '', // Url to an image. Used for custom icons on the webhook. Imgur might not work as they do stupid shit with redirection.
            discordHooks: [
                'hook url goes here',
                'second hook url goes here',

            ],
            slackHooks: [
                'slack hook'
            ]
        }
    ]
};
