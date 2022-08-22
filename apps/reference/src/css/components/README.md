# Components folder

This folder is used to style components that are used globally across the site. A good way to setup a file is to include any themed variables at the top, and the override styles below that. All these partials are imported into the base styles with the sass `@use` rule.

Light themed variables can be targeted using the following selector:

```css
html[data-theme='light'] {
  --ifm-menu-color-background-active: red;
}
```

Dark themed variables can be targeted using the following selector:

```css
html[data-theme='dark'] {
  --ifm-menu-color-background-active: blue;
}
```

Global variables can be overridden at root like this:

```css
:root {
  --sidebar-spacing-horizontal: 1.5rem;
}
```

Styles can be overriden like this:

```css
#__docusaurus {
  .class-to-override {
    margin-block-start: 1rem;
  }
}
```
