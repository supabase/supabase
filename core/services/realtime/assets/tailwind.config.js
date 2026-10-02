const plugin = require("tailwindcss/plugin");
const colors = require("tailwindcss/colors");
const fs = require("fs");
const path = require("path");

module.exports = {
  content: ["./js/**/*.js", "../lib/*_web.ex", "../lib/*_web/**/*.*ex"],
  darkMode: "class",
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      neutral: colors.zinc,
      emerald: colors.emerald,
      indigo: colors.indigo,
      yellow: colors.yellow,
      green: colors.green,
      brand: {
        50: "oklch(96% 0.03 165 / <alpha-value>)",
        100: "oklch(92% 0.06 165 / <alpha-value>)",
        200: "oklch(85% 0.10 165 / <alpha-value>)",
        300: "oklch(77% 0.14 165 / <alpha-value>)",
        400: "oklch(70% 0.16 165 / <alpha-value>)",
        500: "oklch(63% 0.17 165 / <alpha-value>)",
        600: "oklch(55% 0.16 165 / <alpha-value>)",
        700: "oklch(46% 0.14 165 / <alpha-value>)",
        800: "oklch(38% 0.11 165 / <alpha-value>)",
        900: "oklch(30% 0.08 165 / <alpha-value>)",
        DEFAULT: "oklch(63% 0.17 165 / <alpha-value>)",
      },
      success: {
        50: "oklch(96% 0.03 165 / <alpha-value>)",
        100: "oklch(92% 0.06 165 / <alpha-value>)",
        200: "oklch(85% 0.10 165 / <alpha-value>)",
        300: "oklch(77% 0.14 165 / <alpha-value>)",
        400: "oklch(70% 0.16 165 / <alpha-value>)",
        500: "oklch(63% 0.17 165 / <alpha-value>)",
        600: "oklch(55% 0.16 165 / <alpha-value>)",
        700: "oklch(46% 0.14 165 / <alpha-value>)",
        800: "oklch(38% 0.11 165 / <alpha-value>)",
        900: "oklch(30% 0.08 165 / <alpha-value>)",
        DEFAULT: "oklch(63% 0.17 165 / <alpha-value>)",
      },
      warning: {
        50: "oklch(97% 0.03 80 / <alpha-value>)",
        100: "oklch(93% 0.06 80 / <alpha-value>)",
        200: "oklch(87% 0.11 80 / <alpha-value>)",
        300: "oklch(80% 0.14 80 / <alpha-value>)",
        400: "oklch(75% 0.16 80 / <alpha-value>)",
        500: "oklch(68% 0.17 80 / <alpha-value>)",
        600: "oklch(58% 0.16 80 / <alpha-value>)",
        700: "oklch(48% 0.14 80 / <alpha-value>)",
        800: "oklch(40% 0.11 80 / <alpha-value>)",
        900: "oklch(32% 0.09 80 / <alpha-value>)",
        DEFAULT: "oklch(68% 0.17 80 / <alpha-value>)",
      },
      error: {
        50: "oklch(97% 0.02 25 / <alpha-value>)",
        100: "oklch(93% 0.05 25 / <alpha-value>)",
        200: "oklch(86% 0.09 25 / <alpha-value>)",
        300: "oklch(78% 0.13 25 / <alpha-value>)",
        400: "oklch(70% 0.17 25 / <alpha-value>)",
        500: "oklch(63% 0.21 25 / <alpha-value>)",
        600: "oklch(55% 0.20 25 / <alpha-value>)",
        700: "oklch(46% 0.18 25 / <alpha-value>)",
        800: "oklch(38% 0.15 25 / <alpha-value>)",
        900: "oklch(30% 0.11 25 / <alpha-value>)",
        DEFAULT: "oklch(63% 0.21 25 / <alpha-value>)",
      },
      info: {
        50: "oklch(97% 0.02 250 / <alpha-value>)",
        100: "oklch(93% 0.04 250 / <alpha-value>)",
        200: "oklch(86% 0.07 250 / <alpha-value>)",
        300: "oklch(78% 0.10 250 / <alpha-value>)",
        400: "oklch(70% 0.13 250 / <alpha-value>)",
        500: "oklch(63% 0.15 250 / <alpha-value>)",
        600: "oklch(55% 0.16 250 / <alpha-value>)",
        700: "oklch(46% 0.16 250 / <alpha-value>)",
        800: "oklch(38% 0.14 250 / <alpha-value>)",
        900: "oklch(30% 0.11 250 / <alpha-value>)",
        DEFAULT: "oklch(63% 0.15 250 / <alpha-value>)",
      },
    },
    fontFamily: {
      sans: ["custom-font", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      mono: ["Source Code Pro", "Menlo", "monospace"],
    },
    extend: {
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    plugin(({ addVariant }) => addVariant("phx-no-feedback", [".phx-no-feedback&", ".phx-no-feedback &"])),
    plugin(({ addVariant }) => addVariant("phx-click-loading", [".phx-click-loading&", ".phx-click-loading &"])),
    plugin(({ addVariant }) => addVariant("phx-submit-loading", [".phx-submit-loading&", ".phx-submit-loading &"])),
    plugin(({ addVariant }) => addVariant("phx-change-loading", [".phx-change-loading&", ".phx-change-loading &"])),
    plugin(function ({ matchComponents, theme }) {
      let iconsDir = path.join(__dirname, "../deps/heroicons/optimized");
      let values = {};
      let icons = [
        ["", "/24/outline"],
        ["-solid", "/24/solid"],
        ["-mini", "/20/solid"],
      ];
      icons.forEach(([suffix, dir]) => {
        fs.readdirSync(path.join(iconsDir, dir)).forEach((file) => {
          let name = path.basename(file, ".svg") + suffix;
          values[name] = { name, fullPath: path.join(iconsDir, dir, file) };
        });
      });
      matchComponents(
        {
          hero: ({ name, fullPath }) => {
            let content = fs
              .readFileSync(fullPath)
              .toString()
              .replace(/\r?\n|\r/g, "");
            let size = theme("spacing.5");
            if (name.endsWith("-mini")) {
              size = theme("spacing.4");
            }
            return {
              [`--hero-${name}`]: `url('data:image/svg+xml;utf8,${content}')`,
              "-webkit-mask": `var(--hero-${name})`,
              mask: `var(--hero-${name})`,
              "mask-repeat": "no-repeat",
              "background-color": "currentColor",
              "vertical-align": "middle",
              display: "inline-block",
              width: size,
              height: size,
            };
          },
        },
        { values },
      );
    }),
  ],
};
