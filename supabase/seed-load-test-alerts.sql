-- ~50 000 alerts: every 20th athlete across all 100 orgs
DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT;
  ath_id UUID; tid UUID; oid UUID;
BEGIN
  FOR org_i IN 1..100 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        IF (org_i * 10000 + team_i * 100 + ath_i) % 20 = 0 THEN
          ath_id := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
          tid    := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
          oid    := ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid;
          INSERT INTO public.alerts (id, athlete_id, team_id, organization_id, severity, trigger_type, status, created_at)
          VALUES (
            gen_random_uuid(), ath_id, tid, oid,
            (CASE WHEN ath_i % 3 = 0 THEN 'red' ELSE 'yellow' END)::alert_severity,
            'risk_score', 'open'::alert_status,
            NOW() - ((org_i + team_i + ath_i) % 72) * INTERVAL '1 hour'
          )
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
