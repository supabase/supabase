# Supabase UI Package

## Figma-tokens setup

Tokens setup is based partly on blogpost on the [Mirahi Digital Garden](https://garden.mirahi.io/how-to-use-the-color-tokens-from-your-design-system-directly-in-tailwind-css/).

Transforms tokens stored on [Figma Tokens](https://github.com/six7/figma-tokens) using [token-transformer](https://github.com/six7/figma-tokens/tree/main/token-transformer) and [Style Dictionary](https://github.com/amzn/style-dictionary) to css-variables with references, and use them in your [TailwindCSS](https://github.com/tailwindlabs/tailwindcss) environment with multiple themes.

### Build all the styles files (css-variables and tailwind config)

```bash
npm run build-styles
```

This creates a directory called `styles` with the tokens and also CSS required.

### Other examples

You can find [other examples here](https://github.com/six7/figma-tokens-examples) by [Jan Six](https://twitter.com/six7)

### Adding new themes/sets

Add new sets by extending the scripts in package.json. Currently theme sets derive from `exported/[set name]` but can come from anywhere.

Adding a new set can be done with the following:

```json package.json
// package.json

//..
"build-transform-light": "npx token-transformer tokens.json styles/tokens/02_themes/light.json global,exported/light,theme global",
// add a new line like this:
"build-transform-new": "npx token-transformer tokens.json styles/tokens/02_themes/new.json global,new,theme global",
//..
// append the new theme/set command to end of the build-transform command
"build-transform": "npm run build-transform-global && npm run build-transform-typography && npm run build-transform-dark  && npm run build-transform-light && npm run build-transform-new",

```
