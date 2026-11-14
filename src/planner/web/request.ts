// Per-request helpers for planner pages: the picked name (technical note
// §6.3), the clock (one clock, NFR-14), save notices after a redirect (C16),
// and public demo mode (DEC-49, DEC-61). Server only.

import type { AstroCookies } from 'astro';
import { createClock, createReaderClock, type Clock } from '../clock/clock.ts';
import { librebookingUrl, settings } from '../server.ts';
import { BASE } from '../ui/routes.ts';

export const NAME_COOKIE = 'gm_name';
const FLASH_COOKIE = 'gm_flash';
export const READER_CLOCK_COOKIE = 'gm_demo_at';

const cookieOptions = { path: BASE, httpOnly: true, sameSite: 'lax' as const, secure: import.meta.env.PROD };

export interface Notice {
	kind: 'success' | 'problem' | 'demo';
	title: string;
	body: string;
}

export function pickedName(cookies: AstroCookies): string | null {
	return cookies.get(NAME_COOKIE)?.value?.trim() || null;
}

export function rememberName(cookies: AstroCookies, name: string): void {
	// Long-lived: the device remembers the name until someone changes it (AC-10.2).
	cookies.set(NAME_COOKIE, name, { ...cookieOptions, maxAge: 60 * 60 * 24 * 400 });
}

/** The one clock for this request. */
export function clockFor(cookies: AstroCookies): Clock {
	if (settings.publicDemo) return createReaderClock(cookies.get(READER_CLOCK_COOKIE)?.value);
	return createClock({ demoMode: settings.demoMode, librebookingUrl: librebookingUrl() });
}

export function setNotice(cookies: AstroCookies, notice: Notice): void {
	cookies.set(FLASH_COOKIE, JSON.stringify(notice), { ...cookieOptions, maxAge: 60 });
}

/** The notice left by the last save, once. */
export function takeNotice(cookies: AstroCookies): Notice | null {
	const raw = cookies.get(FLASH_COOKIE)?.value;
	if (!raw) return null;
	cookies.delete(FLASH_COOKIE, { path: BASE });
	try {
		const n = JSON.parse(raw) as Notice;
		return typeof n.title === 'string' && typeof n.body === 'string' ? n : null;
	} catch {
		return null;
	}
}
