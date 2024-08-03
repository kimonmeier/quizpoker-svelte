import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: {
			'@server': path.resolve('src/server/'),
			'@poker-lib': path.resolve('src/lib/'),
			'@client': path.resolve('src/client/')
		}
	},
	plugins: [sveltekit()]
});
