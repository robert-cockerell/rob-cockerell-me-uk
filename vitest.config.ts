import { defineConfig } from 'vitest/config';

// Planner unit tests sit beside their modules (DEC-60). The stand-in's
// *.node-test.ts files run on Node's own runner (T1 assumption A-3).
export default defineConfig({
	test: {
		include: ['src/planner/**/*.test.ts'],
		environment: 'node',
	},
});
