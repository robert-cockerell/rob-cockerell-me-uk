// Before the browser tests: SU.05 (reset R0) and SU.06 (clock to Tue 16 June
// 2026 07:00, held), with the same code as the tester console and
// `npm run demo:reset`. This changes the shared demo clock in the development
// project; it's left at the S1 starting state.

import { existsSync } from 'node:fs';
import { setStartingState } from './stand-in.ts';

export default async function globalSetup() {
	if (existsSync('.env')) process.loadEnvFile('.env');
	await setStartingState('R0', '2026-06-16 07:00');
}
