// The stand-in's settings, read on the server only.
//
// Technical note §7.1 asks for these to be declared in Astro's env schema
// (astro:env), which needs a change to astro.config.mjs. That needs Rob's
// agreement (root CLAUDE.md), so for now they're read here, in one place:
// process.env at run time (Vercel, `npm run demo:reset`), then import.meta.env
// under `astro dev`. Move to astro:env when astro.config can change.

type EnvSource = Record<string, string | undefined> | undefined;

const viteEnv: EnvSource = (import.meta as ImportMeta & { env?: EnvSource }).env;

function read(name: string): string | undefined {
	const value = process.env[name] ?? viteEnv?.[name];
	return value === undefined || value.trim() === '' ? undefined : value.trim();
}

export interface StandinSettings {
	supabaseUrl: string | undefined;
	supabaseServiceKey: string | undefined;
	consoleKey: string | undefined;
	publicDemo: boolean;
}

export function standinSettings(): StandinSettings {
	return {
		supabaseUrl: read('GM_SUPABASE_URL'),
		supabaseServiceKey: read('GM_SUPABASE_SERVICE_KEY'),
		consoleKey: read('GM_STANDIN_CONSOLE_KEY'),
		publicDemo: read('GM_PUBLIC_DEMO') === 'true',
	};
}
