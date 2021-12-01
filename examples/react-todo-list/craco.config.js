module.exports = {
  style: {
    postcss: {
      plugins: [require("@tailwindcss/postcss7-compat"), require("autoprefixer")],
    },
  },
};
