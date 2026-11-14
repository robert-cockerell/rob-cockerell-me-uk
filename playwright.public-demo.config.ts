import { defineConfig, devices } from '@playwright/test';

// Public demo mode (GM_PUBLIC_DEMO, DEC-49, DEC-61): its own dev server, since
// Astro runs one dev server per project at a time. Run after the main suite
// (npm run test:e2e). It reads the same development database and saves nothing.
const PORT = 4322;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e/planner',
	testMatch: /public-demo.spec.ts/,
	globalSetup: './e2e/planner/global-setup.ts',
	workers: 1,
	reporter: [['list']],
	timeout: 60_000,
	use: { baseURL: ORIGIN, ...devices['Desktop Chrome'] },
	projects: [{ name: 'public-demo-390x844', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
	webServer: {
		command: `npm run dev -- --port ${PORT}`,
		url: `${ORIGIN}/demos/charging-planner/stand-in/clock`,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			GM_LIBREBOOKING_URL: `${ORIGIN}/demos/charging-planner/stand-in/api`,
			GM_DEMO_MODE: 'true',
			// AC-16.1: the proof of concept's handbook address (invented).
			GM_HANDBOOK_URL: 'https://docs.google.com/document/d/1RPkcPU35zs2kVmVeexJCgjuZUeO2-jFecB7i5H7U6nf/edit',
			GM_PUBLIC_DEMO: 'true',
		},
	},
});
