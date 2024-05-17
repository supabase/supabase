# ./packages/icons

This package is for custom Supabase icons
They can be used alongside any other icon packages

## example use

```jsx
import { ReplaceCode, InsertCode } from 'icons'

function app() {
  return (
    <>
      <ReplaceCode className="text-light" strokeWidth={1} size={16} />
      <InsertCode className="text-light" strokeWidth={1} size={16} />
    </>
  )
}
```

## adding new icons

Add new icons into ./src/raw-icons

Make sure there are no inline stroke/border/fill colors (see below)

run this in ./packages/build-icons

```bash
npm run build
```

This will output icons into ./src/icons and update import names/paths

### Design spec

Icons should:

- always be exported 24x24px,
- and have an icon inside that frame that's around 18x18px(ish)

### ❌ bad example

Notice the stroke, stroke-linecap, fills, etc.
These need to be in the parent <svg> so the react component can easily control it.
The SVG child elements will then respect their parent's attributes.

```svg
<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    >
        <rect <-- silly backgrounds figma adds in
            width="24"
            height="24"
            fill="#1E1E1E"
        />
        <path <--  silly backgrounds figma adds in
            d="M-20439
            -11141C-20439..."
            fill="#404040"
        />
        <path
            d="M-20437 -11142H12131V-11144H-20437V-11142ZM12132 ...."
            fill="white"
            fill-opacity="0.1"
        />
        <path
            d="M22.8437 8.69499L19.5369 12.0018L22.8438 15.3086..."
            stroke="#EDEDED"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <rect
            x="0.5"
            y="14.0625"
            width="16"
            height="8"
            rx="1"
            stroke="#EDEDED"
            stroke-linejoin="round"
        />
        <rect
            x="0.5"
            y="1.9375"
            width="16"
            height="8"
            rx="1"
            stroke="#EDEDED"
            stroke-linejoin="round"
        />
</svg>

```

✅ Good example

We've now cleaned it up, and the parent SVG element now has all the attributes for color and stroke width styling.
We have also removed the redundant elements that figma adds in like background / artboard backgrounds.

```svg
<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
    stroke-linejoin="round"
    >
        <path d="M-20439 -11141C-20439..." />
        <path d="M-20437 -11142H12131V-11144H-20437V-11142ZM12132 ...."/>
        <path d="M22.8437 8.69499L19.5369 12.0018L22.8438 15.3086..." />
        <rect x="0.5" y="14.0625" width="16" height="8" rx="1" />
        <rect x="0.5" y="1.9375" width="16" height="8" rx="1" />
</svg>
```
