# Styles

## When to write custom styles

Tailwind should be sufficient to cover the majority of styling needs. We typically only write custom styles here in the event where we're working with an external library and we need to override some styles (e.g Monaco, or even our own UI library).

Ideally, keep custom styling here to a minimum, use tailwind directly in the pages and components where possible, so that we have less code to maintain.

## If you're writing custom styles

Group custom styles into separate stylesheets based on their context. For styles which are generic and global, we can write them in `main.scss`.
