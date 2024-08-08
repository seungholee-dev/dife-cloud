import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import sytlisticTs from "@stylistic/eslint-plugin-ts";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
	{ ignores: ["**/cdk.out/", "**/node_modules/"] },
	{ files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
	{ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			"@stylistic/ts": sytlisticTs,
		},
		rules: {
			"@stylistic/ts/semi": ["error", "always"],
			"react/prop-types": "off",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
	eslintConfigPrettier,
];
