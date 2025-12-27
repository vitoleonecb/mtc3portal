/** @type {import('tailwindcss').Config} */

module.exports = {
	darkMode: ["class"],
	content: [
	  "./index.html",
	  "./src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		},
		// This is the IMPORTANT part:
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
	  },
	},
	plugins: [],
  }
  