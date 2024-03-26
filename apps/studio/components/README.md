# Writing components

## Where to create your components

- For components that declare the general structure and layout of a page:
  - `/components/layouts/xxx`
- For components that are tightly coupled to a specific interface:
  - `/components/interfaces/xxx`
- For components that are meant to be reusable across multiple pages:
  - `/components/ui/xxx`
- Note: We're gradually moving files out of the `to-be-cleaned` folder into the respective folders as we refactor

## Component structure

- If a component has constants and utility methods that are tightly coupled to itself, keep them close to the component and enclose them in a folder with an `index.tsx` as an entry point
- Otherwise it can just be a file on its own
- For example:
  - ```
    components/ui
    - SampleComponentA
      - SampleComponentA.tsx
      - SampleComponentA.constants.ts
      - SampleComponentA.utils.ts
      - SampleComponentA.types.ts
      - index.ts
    - SampleComponentB.tsx
    ```

## Template for building components

```ts

// Declare the prop types of your component
interface ComponentAProps {
  sampleProp: string
}

// Name your component accordingly
const ComponentA = ({ sampleProp }: ComponentAProps) => {
  return <div>ComponentA: {sampleProp}</div>
}

export default ComponentA
```
