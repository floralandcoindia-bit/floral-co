-- OPTIONAL. Makes the ImageKit order picture disappear within the hour (instead of within a day).
-- Vercel's free plan only runs cron jobs once a day, so by default pictures of expired orders are deleted
-- on the next daily run. This asks Supabase to poke the same cleanup function every hour instead.
--
-- 1. Replace YOUR-SITE.vercel.app and YOUR-CRON-SECRET (the same value as the CRON_SECRET env var in Vercel).
-- 2. Run in the Supabase SQL Editor.
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'floral-image-cleanup') then
    perform cron.unschedule('floral-image-cleanup');
  end if;
  perform cron.schedule(
    'floral-image-cleanup',
    '10 * * * *',
    $job$
      select net.http_get(
        url     := 'https://YOUR-SITE.vercel.app/api/cron-cleanup',
        headers := jsonb_build_object('Authorization', 'Bearer YOUR-CRON-SECRET')
      );
    $job$
  );
end $$;
