-- Process 1 on a schedule (DEC-48, technical note §7). PROPOSED: not pushed.
-- Kept in supabase/proposed/ so `npm run db:push` can't apply it by accident.
-- Once Rob approves it, move it to supabase/migrations/ and push.
--
-- pg_cron runs every 30 minutes and uses pg_net to POST to the forecast job
-- endpoint on the production deployment, with the shared secret as a bearer
-- token. pg_cron can't reach preview deployments or Rob's machine, so until
-- the planner is on production, run `npm run job:forecast` instead.
--
-- Before pushing, set two secrets in Supabase Vault (Dashboard → Project
-- settings → Vault), so neither is in this file or in git:
--   gm_forecast_job_url     https://<production site>/demos/charging-planner/api/forecast-job
--   gm_forecast_job_secret  the same value as GM_FORECAST_JOB_SECRET in Vercel

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
	'gm-forecast-job',
	'*/30 * * * *',
	$$
	select net.http_post(
		url := (select decrypted_secret from vault.decrypted_secrets where name = 'gm_forecast_job_url'),
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'gm_forecast_job_secret')
		),
		body := '{}'::jsonb,
		timeout_milliseconds := 15000
	);
	$$
);
