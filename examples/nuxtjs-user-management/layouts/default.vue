<template>
  <div>
    <Nuxt />
  </div>
</template>

<style>
html,
body {
  --custom-font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  --custom-bg-color: #1f1f1f;
  --custom-box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.8);
  --custom-color: #fff;
  --custom-color-brand: #24b47e;
  --custom-color-secondary: #666;
  --custom-border: 1px solid #666;
  --custom-border-radius: 5px;
  --custom-spacing: 5px;

  padding: 0;
  margin: 0;
  font-family: var(--custom-font-family);
  background-color: var(--custom-bg-color);
}

* {
  color: var(--custom-color);
  font-family: var(--custom-font-family);
  box-sizing: border-box;
}

/* Forms */

label {
  display: block;
  margin: 5px 0;
  color: var(--custom-color-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
}

input {
  width: 100%;
  border-radius: 5px;
  border: var(--custom-border);
  padding: 6px;
  font-size: 0.9rem;
  background-color: var(--custom-bg-color);
  color: var(--custom-color);
}

input[disabled] {
  color: var(--custom-color-secondary);
}

/* Utils */

.w-half {
  width: 50%;
}

.block {
  display: block;
  width: 100%;
}
.inline-block {
  display: inline-block;
  width: 100%;
}

.flex {
  display: flex;
}
.flex.column {
  flex-direction: column;
}
.flex.row {
  flex-direction: row;
}
.flex.flex-1 {
  flex: 1 1 0;
}

/* Button */

button,
.button {
  color: var(--custom-color);
  border: var(--custom-border);
  background-color: var(--custom-bg-color);
  display: inline-block;
  text-align: center;
  border-radius: var(--custom-border-radius);
  padding: 0.5rem 1rem;
  cursor: pointer;
  text-align: center;
  font-size: 0.9rem;
  text-transform: uppercase;
}

button.primary,
.button.primary {
  background-color: var(--custom-color-brand);
  border: 1px solid var(--custom-color-brand);
}

/* Widgets */

.card {
  width: 100%;
  display: block;
  border: var(--custom-border);
  border-radius: var(--custom-border-radius);
  padding: var(--custom-spacing);
}

.avatar {
  border-radius: var(--custom-border-radius);
  overflow: hidden;
  max-width: 100%;
}
.avatar.image {
  object-fit: cover;
}
.avatar.noImage {
  background-color: rgb(230, 230, 230);
  border: 2px dotted rgb(200, 200, 200);
  border-radius: 5px;
}
.avatar.noImage:after {
  font-family: var(--custom-font-family);
  content: "No avatar photo";
  display: block;
  font-size: 16px;
  color: rgb(100, 100, 100);

  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  -webkit-transform: translateY(-50%);
  transform: translateY(-50%);
  text-align: center;
}
</style>
