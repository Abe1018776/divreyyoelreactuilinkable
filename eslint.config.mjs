// eslint.config.mjs
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    // Apply to all relevant JavaScript/TypeScript files
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser, // Standard browser globals
        ...globals.node,    // Standard Node.js globals
        React: "readonly",   // Define React global for JSX
      },
      parser: tseslint.parser, // Use the TypeScript ESLint parser
      parserOptions: {
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        ecmaVersion: "latest",       // Use modern ECMAScript features
        sourceType: "module",        // Use ES modules
        project: "./tsconfig.json",  // Path to your tsconfig.json for typed linting
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin, // Register TypeScript ESLint plugin
      react: pluginReact,                     // Register React plugin
      "@next/next": nextPlugin,               // Register Next.js plugin
    },
    rules: {
      // Base recommended rules
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules, // TypeScript recommended rules
      ...pluginReact.configs.recommended.rules, // React recommended rules

      // Next.js specific recommended rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Common overrides for Next.js + TypeScript projects
      "react/react-in-jsx-scope": "off", // Not needed with Next.js's new JSX transform
      "react/prop-types": "off",         // TypeScript handles prop types

      // You can add or override more rules here if desired
      // Example: "@typescript-eslint/no-explicit-any": "warn",
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
  },
];