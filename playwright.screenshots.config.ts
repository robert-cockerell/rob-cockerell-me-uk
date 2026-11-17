import { defineConfig, devices } from '@playwright/test';

// UI spec §13 item 1: the screenshot set, at the four review sizes, light and
// dark (the test sets the colour scheme). `npm run test:screenshots`.
const PORT = 4321;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e/planner',
	testMatch: /screenshots\.spec\.ts/,
	globalSetup: './e2e/planner/global-setup.ts',
	workers: 1,
	reporter: [['list']],
	timeout: 60_000,
	use: { baseURL: ORIGIN, ...devices['Desktop Chrome'] },
	projects: [
		{ name: '390x844', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
		{ name: '1024x768', use: { viewport: { width: 1024, height: 768 } } },
		{ name: '1440x900', use: { viewport: { width: 1440, height: 900 } } },
		{ name: '1920x1080', use: { viewport: { width: 1920, height: 1080 } } },
	],
	webServer: {
		command: `npm run dev -- --port ${PORT}`,
		url: `${ORIGIN}/demos/charging-planner/stand-in/clock`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			GM_LIBREBOOKING_URL: `${ORIGIN}/demos/charging-planner/stand-in/api`,
			GM_DEMO_MODE: 'true',
			GM_PUBLIC_DEMO: 'false',
			GM_HANDBOOK_URL: 'https://docs.google.com/document/d/1RPkcPU35zs2kVmVeexJCgjuZUeO2-jFecB7i5H7U6nf/edit',
		},
	},
});
