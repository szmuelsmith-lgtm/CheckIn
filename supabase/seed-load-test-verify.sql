SELECT
  (SELECT count(*) FROM public.organizations WHERE id::text LIKE 'aaaaaaaa-%') AS orgs,
  (SELECT count(*) FROM public.teams         WHERE id::text LIKE 'bbbbbbbb-%') AS teams,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'dddddddd-%') AS athletes,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'cccccccc-%') AS coaches,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'eeeeeeee-%') AS admins,
  (SELECT count(*) FROM public.checkins      WHERE athlete_id::text LIKE 'dddddddd-%') AS checkins,
  (SELECT count(*) FROM public.alerts        WHERE organization_id::text LIKE 'aaaaaaaa-%') AS alerts;
