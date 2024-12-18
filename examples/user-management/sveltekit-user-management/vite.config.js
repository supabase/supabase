import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit({
		experimental: {
			runes: true
		}
	})],
	build: {
		target: 'esnext'
	},
	server: {
		fs: { allow: ['.'] }
	},
	preview: {
		host: true,
		strictPort: true
	}
});
