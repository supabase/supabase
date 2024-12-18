import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: true
			}
		})
	],
	build: {
		target: 'esnext',
		minify: true
	},
	optimizeDeps: {
		include: ['@supabase/supabase-js']
	}
});
