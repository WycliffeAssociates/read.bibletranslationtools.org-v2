export default {
  plugins: ["prettier-plugin-tailwindcss", "prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: { parser: "astro" }
    }
  ],
  trailingComma: "none",
  semi: true,
  singleQuote: false,
  printWidth: 80
};
