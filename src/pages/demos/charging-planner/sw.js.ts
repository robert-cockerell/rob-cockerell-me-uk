// REQ-17, technical note §6.4: a small service worker that keeps the last
// day plan the phone loaded, and shows it with a notice and its load time when
// the network is down. Only the day plan is kept (NFR-10: "the phone keeps
// only the last loaded plan"), plus the files it needs to look right.
// Served from the planner's own route, so its scope is the planner only.

const BASE = '/demos/charging-planner/';

const worker = `
const PLAN_URL = ${JSON.stringify(BASE)};
const PLAN_CACHE = 'gm-day-plan-v1';
const ASSET_CACHE = 'gm-day-plan-assets-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const isPlan = (url) => url.origin === self.location.origin && url.pathname === PLAN_URL;

// Keep a plain copy: just the page and its type, so no Vary or caching header gets in the way.
async function keep(response) {
	const copy = new Response(await response.clone().text(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
	await (await caches.open(PLAN_CACHE)).put(PLAN_URL, copy);
}

// The cached page carries a hidden offline notice; reveal it when it's served offline.
async function offlinePlan() {
	const cached = await (await caches.open(PLAN_CACHE)).match(PLAN_URL, { ignoreVary: true, ignoreSearch: true });
	if (!cached) {
		return new Response(
			'<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Day plan – Charging planner</title><p style="font-family:sans-serif;padding:1rem">You\\'re offline, and this phone hasn\\'t loaded a day plan yet. Try again when you\\'re connected.</p></html>',
			{ status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
		);
	}
	const html = await cached.text();
	const hide = 'style="display:none"';
	const at = html.indexOf('data-offline-notice');
	const styleAt = at < 0 ? -1 : html.indexOf(hide, at);
	const shown = styleAt < 0 ? html : html.slice(0, styleAt) + html.slice(styleAt + hide.length);
	return new Response(shown, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// The first time, the page isn't controlled yet: it asks for the plan and its files to be kept.
self.addEventListener('message', (event) => {
	if (!event.data || event.data.type !== 'keep-plan') return;
	event.waitUntil((async () => {
		const plan = await fetch(PLAN_URL, { credentials: 'same-origin' });
		if (plan.ok) await keep(plan);
		const assets = await caches.open(ASSET_CACHE);
		await Promise.all((event.data.assets || []).map((u) =>
			fetch(u).then((r) => (r.ok ? assets.put(u, r) : undefined)).catch(() => undefined)));
	})());
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		if (!isPlan(url)) return;
		// Network first: a fresh plan replaces the stored one (AC-17.2).
		event.respondWith(
			fetch(request)
				.then(async (response) => {
					if (response.ok) await keep(response);
					return response;
				})
				.catch(offlinePlan),
		);
		return;
	}

	// The files the plan needs (styles, scripts, fonts, icons): network first, the last copy offline.
	if (['style', 'script', 'font', 'image'].includes(request.destination)) {
		event.respondWith(
			fetch(request)
				.then(async (response) => {
					if (response.ok) await (await caches.open(ASSET_CACHE)).put(request, response.clone());
					return response;
				})
				.catch(async () => (await caches.match(request, { ignoreVary: true })) ?? Response.error()),
		);
	}
});
`;

export function GET() {
	return new Response(worker, {
		headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' },
	});
}
