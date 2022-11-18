// https://github.com/ota-meshi/eslint-plugin-astro
module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	overrides: [
		{
			files: ["*.astro"],
			parser: "astro-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
				extraFileExtensions: [".astro"],
				sourceType: "module",
			},
			extends: ["plugin:astro/recommended", "plugin:astro/jsx-a11y-strict"],
			rules: {
			  "astro/no-conflict-set-directives": "error",
        "astro/no-unused-define-vars-in-style": "error",
			},
		},
	],
};