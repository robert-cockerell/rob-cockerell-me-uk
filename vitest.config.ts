import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Planner unit tests sit beside their modules (DEC-60). The stand-in's
// *.node-test.ts files run on Node's own runner (T1 assumption A-3).
export default defineConfig({
	resolve: {
		// Astro's settings module only exists inside Astro; tests get a stub with no secrets.
		alias: { 'astro:env/server': fileURLToPath(new URL('./src/planner/test/astro-env.stub.ts', import.meta.url)) },
	},
	test: {
		include: ['src/planner/**/*.test.ts'],
		environment: 'node',
	},
});
