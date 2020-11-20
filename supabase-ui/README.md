# Supabase UI

## Using Supabase UI

Install the NPM package

```cli
npm install @supabase/ui
```

Example of importing a component

```js
@import { Button } from '@supabase/ui'

//...

return (
  <Button>I am a Supabase UI button</Button>
)
```

## Run storybook locally

Supabase UI uses storybook to develop and organise components.
They can be viewed locally in the Storybook docs explorer

make sure you are in the supabase-ui folder

```cli
cd supabase-ui
```

run storybook

```cli
npm run storybook
```

(you may need to run `npm install` first)

Storybook runs by default on `http://localhost:6006/`

## Local Development

If you want to test Supabase UI components locally, in context in another project locally, then you will need to `npm link` the supabase-ui project locally.

Follow these instructions here -> 
[NPM Linking and Unlinking instructions](https://dev.to/erinbush/npm-linking-and-unlinking-2h1g)
