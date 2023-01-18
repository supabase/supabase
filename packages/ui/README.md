# Figma-tokens setup

Tokens setup is based partly on blogpost on the [Mirahi Digital Garden](https://garden.mirahi.io/how-to-use-the-color-tokens-from-your-design-system-directly-in-tailwind-css/).

Transforms tokens stored on [Figma Tokens](https://github.com/six7/figma-tokens) using [token-transformer](https://github.com/six7/figma-tokens/tree/main/token-transformer) and [Style Dictionary](https://github.com/amzn/style-dictionary) to css-variables with references, and use them in your [TailwindCSS](https://github.com/tailwindlabs/tailwindcss) environment with multiple themes.

## Build all the styles files (css-variables and tailwind config)

```bash
npm run build-styles
```

## Other examples

You can find [other examples here](https://github.com/six7/figma-tokens-examples) by [Jan Six](https://twitter.com/six7)
