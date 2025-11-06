# Assets Folder

This folder contains static assets for the UR Life application.

## Required Assets

### Logo
- `symbol_only.svg` - University of Rochester official logo

You need to add the UR logo file here. You can:

1. Download it from the [University of Rochester website](https://www.rochester.edu)
2. Copy it from the original UR Life project
3. Use a placeholder for development

### Placeholder SVG

If you don't have the official logo, create a simple placeholder:

```xml
<!-- symbol_only.svg -->
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#5B9BD5"/>
  <text x="50" y="60" font-size="40" text-anchor="middle" fill="white" font-weight="bold">UR</text>
</svg>
```

## Usage

The logo is used in:
- Login page (`index.html`)
- Dashboard header (`dashboard.html`)

## Copyright

The University of Rochester logo is trademarked and should only be used in accordance with university brand guidelines.
