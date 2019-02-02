# Reddit webhook 

Simple script that allows you to set up announcements of new posts in various subreddits to a variety of discord and slack channels. 

Setup is fairly straightforward:

1. Use https://github.com/not-an-aardvark/reddit-oauth-helper and follow the steps given there to make an app for reddit, make sure to create a "personal use script"  on the reddit side of things.
2. Select "personal use script" 
3. Read scope is all you need for this bot. 
4. Use the values you have given in `config.js`, `config_example.js` for what you need to fill in. **Do not** copy the details from the oauth helper directly as the object key names are written down differently. 
5. Create the webhooks for discord and/or slack you need. 
6. Fill in the rest of the details in config
