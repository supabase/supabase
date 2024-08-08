# Open Graph (OG) Image Generator

Generate OG Images for the sites at supabase.

## How to use

To use the og image generator, you will need to visit the site with the following parameters:

`site`: indicating which site you want to generate an image for. Currently, the only available option is docs.

`title`: representing the title of the image you want to generate.

`description`: representing the description of the image you want to generate.

`type` (optional): indicating the type of image you want to generate. This is optional and is only used for the docs site.

`icon` (optional): indicating the icon you want to use for the image. This is optional and is only used for the docs site.

If any of the required parameters are missing, you will receive a 404 response with a message indicating that some parameters are missing. If the site parameter is not recognized, you will receive a 404 response with a message indicating that the site was not found.

Here is an example link that you can use to test the website:

https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=docs&title=Example%20Title&description=Example%20Description&type=Auth&icon=google

This link will generate an image for the docs site with the title "Example Title", the description "Example Description", the Auth type, and the Google icon.

## Run locally

First we need to start up supabase using the [supabase cli](https://supabase.com/docs/reference/cli/introduction)

```bash
supabase start
```

Then run the function

```bash
supabase functions serve og-images
```

Now we can visit [localhost:54321/functions/v1/og-images/?site=docs&title=Title&description=Description&type=Auth](http://localhost:54321/functions/v1/og-images/?site=docs&title=Title&description=Description&type=Auth) to see your changes localy.

## Deploy

To deploy this function, you currently need to depoy it locally. To do this follow the steps below.

```bash
supabase functions deploy og-images --no-verify-jwt
```
