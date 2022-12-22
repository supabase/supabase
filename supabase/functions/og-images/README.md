# Open Graph (OG) Image Generator

Generate  OG Images for the sites at supabase.

## How to use

To use the og image generator, you will need to visit the site with the following parameters:

`site`: a string indicating which site you want to generate an image for. Currently, the only available option is docs.

`title`: a string representing the title of the image you want to generate.

`description`: a string representing the description of the image you want to generate.

`type`: a string indicating the type of image you want to generate. This is optional and is only used for the docs site.

`icon`: a string indicating the icon you want to use for the image. This is optional and is only used for the docs site.

If any of these required parameters are missing, you will receive a 404 response with a message indicating that some parameters are missing.

If the site parameter is not recognized, you will receive a 404 response with a message indicating that the site was not found.

If all required parameters are provided and the site is recognized, you will receive an image in the form of a PNG file with the specified title, description, and other optional parameters included. The image will have a width of 1200 pixels and a height of 600 pixels.

Here is an example link that you can use to test the website:

https://www.example.com/image-generator?site=docs&title=Example%20Title&description=Example%20Description&type=Auth&icon=google

This link will generate an image for the docs site with the title "Example Title", the description "Example Description", the Auth type, and the Google icon.

## Run locally

First we need to start supabase using the [supabase cli](https://supabase.com/docs/reference/cli/introduction)

```bash
supabase start
```

Then run the function
```bash
supabase functions serve og-images
```

Now we can visit [localhost:54321/functions/v1/og-images/?site=docs&title=Title&description=Description&type=Auth](http://localhost:54321/functions/v1/og-images/?site=docs&title=Title&description=Description&type=Auth) to see your changes localy.