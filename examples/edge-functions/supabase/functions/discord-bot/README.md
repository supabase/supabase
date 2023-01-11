# Discord Slash Command Bot

## Helpful docs

- https://deno.com/deploy/docs/tutorial-discord-slash
- https://discord.com/developers/docs/interactions/application-commands#slash-commands

## Create an application on Discord Developer Portal

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications) (login using your discord account if required).
2. Click on **New Application** button available at left side of your profile picture.
3. Name your application and click on **Create**.
4. Go to **Bot** section, click on **Add Bot**, and finally on **Yes, do it!** to confirm.

That's it. A new application is created which will hold our Slash Command. Don't close the tab as we need information from this application page throughout our development.

Before we can write some code, we need to curl a discord endpoint to register a Slash Command in our app.

Fill `DISCORD_BOT_TOKEN` with the token available in the **Bot** section and `CLIENT_ID` with the ID available on the **General Information** section of the page and run the command on your terminal.

```bash
BOT_TOKEN='replace_me_with_bot_token'
CLIENT_ID='replace_me_with_client_id'
curl -X POST \
-H 'Content-Type: application/json' \
-H "Authorization: Bot $BOT_TOKEN" \
-d '{"name":"hello","description":"Greet a person","options":[{"name":"name","description":"The name of the person","type":3,"required":true}]}' \
"https://discord.com/api/v8/applications/$CLIENT_ID/commands"
```

This will register a Slash Command named `hello` that accepts a parameter named `name` of type string.

## Deploy the Slash Command Handler

```bash
supabase functions deploy discord-bot --no-verify-jwt
supabase secrets set DISCORD_PUBLIC_KEY=your_public_key
```

Navigate to your Function details in the Supabase Dashboard to get your Endpoint URL.

### Configure Discord application to use our URL as interactions endpoint URL

1. Go back to your application (Greeter) page on Discord Developer Portal
2. Fill **INTERACTIONS ENDPOINT URL** field with the URL and click on **Save Changes**.

The application is now ready. Let's proceed to the next section to install it.

## Install the Slash Command on your Discord server

So to use the `hello` Slash Command, we need to install our Greeter application on our Discord server. Here are the steps:

1. Go to **OAuth2** section of the Discord application page on Discord Developer Portal
2. Select `applications.commands` scope and click on the **Copy** button below.
3. Now paste and visit the URL on your browser. Select your server and click on **Authorize**.

Open Discord, type `/Promise` and press **Enter**.

## Run locally

```bash
supabase functions serve discord-bot --no-verify-jwt --env-file ./supabase/functions/discord-bot/.env
ngrok http 54321
```
