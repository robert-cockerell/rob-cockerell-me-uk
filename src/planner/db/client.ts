// The planner's Supabase client: server only, with the service key (technical
// note §6.2). Never import this into anything sent to the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface DbSettings {
	url: string;
	serviceKey: string;
}

export function createDbClient(settings: DbSettings): SupabaseClient {
	return createClient(settings.url, settings.serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
	});
}

export class DbError extends Error {}

/** Throw on a Supabase error, with the operation named for the server log. */
export function check(operation: string, error: { message: string } | null): void {
	if (error) throw new DbError(`${operation} failed: ${error.message}`);
}
