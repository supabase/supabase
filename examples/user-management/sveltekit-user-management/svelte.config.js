import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use static adapter for SPA deployment
		adapter: adapter({
			fallback: 'index.html',
			strict: false
		}),
		// Ensure client-side routing works
		paths: {
			base: ''
		}
	},

	compilerOptions: {
		runes: true
	}
};

export default config;
