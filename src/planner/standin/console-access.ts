// Who may use the tester console (Stage 1 item 4, technical note §5, DEC-49).
// It's protected by GM_STANDIN_CONSOLE_KEY and switched off in public demo mode.
// The key is typed once; the browser keeps a hash of it in an HTTP-only cookie.

import { createHash, timingSafeEqual } from 'node:crypto';

export const CONSOLE_COOKIE = 'gm_standin_console';
export const CONSOLE_PATH = '/demos/charging-planner/stand-in/console';

export type ConsoleAccess =
	/** GM_PUBLIC_DEMO is on: the console doesn't exist. */
	| 'off'
	/** No GM_STANDIN_CONSOLE_KEY: nobody can open it. */
	| 'no-key'
	/** Key set, but this browser hasn't given it. */
	| 'locked'
	| 'open';

export function consoleToken(key: string): string {
	return createHash('sha256').update(`gm-standin-console:${key}`).digest('hex');
}

function same(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

export function keyMatches(given: string, key: string): boolean {
	return same(consoleToken(given), consoleToken(key));
}

export function consoleAccess(options: {
	publicDemo: boolean;
	key: string | undefined;
	cookie: string | undefined;
}): ConsoleAccess {
	if (options.publicDemo) return 'off';
	if (!options.key) return 'no-key';
	if (options.cookie && same(options.cookie, consoleToken(options.key))) return 'open';
	return 'locked';
}
