-- ============================================================
-- Load-test seed: 100 orgs × 100 teams × 100 athletes
--   = 1 000 000 athletes
--   + 2 check-ins per athlete = 2 000 000 checkins
--   + ~5% athletes get alerts  = ~50 000 alerts
--
-- UUID encoding (all deterministic, human-readable):
--   Org i    : aaaaaaaa-0000-0000-0000-{i:12}
--   Team j   : bbbbbbbb-{i:4}-0000-{j:4}-000000000001
--   Coach j  : cccccccc-{i:4}-0000-{j:4}-000000000001
--   Athlete k: dddddddd-{i:4}-{j:4}-{k:4}-000000000001
--   Admin    : eeeeeeee-0000-0000-0000-{i:12}
--
-- Run via CLI (not SQL editor — too large):
--   SUPABASE_ACCESS_TOKEN=... npx supabase db query --linked -f supabase/seed-load-test.sql
--
-- Idempotent: ON CONFLICT DO NOTHING on all inserts.
-- ============================================================

-- ── 1. 100 Organizations ─────────────────────────────────────────────────────

DO $$
DECLARE
  org_i INT;
  org_names TEXT[] := ARRAY[
    'State University','Pacific University','Atlantic College','Mountain State U',
    'Central University','Northern College','Southern University','Eastern State U',
    'Western College','Lakeside University','Riverside Athletics','Hillcrest U',
    'Valley College','Coastal University','Midland State','Pinewood U',
    'Oakwood College','Maplewood University','Cedar State','Birch College',
    'Elmwood University','Aspen Athletics','Redwood State','Sequoia U',
    'Horizon University','Summit College','Crestview State','Ridgeline U',
    'Brookfield College','Clearwater University','Stonebridge State','Ironwood U',
    'Harborview College','Bayshore University','Lakeview State','Bluewater U',
    'Greenfield College','Meadowbrook University','Springdale State','Autumnfield U',
    'Winterhaven College','Sunnyside University','Ravenwood State','Thornberry U',
    'Foxwood College','Pinecrest University','Willowbrook State','Cedarwood U',
    'Hawthorn College','Juniper University','Sycamore State','Magnolia U',
    'Cypress College','Dogwood University','Hickory State','Chestnut U',
    'Walnut College','Hazel University','Alder State','Cottonwood U',
    'Poplar College','Spruce University','Fir State','Larch U',
    'Hemlock College','Tamarack University','Buckeye State','Buckthorn U',
    'Ironbark College','Silkwood University','Stonewood State','Ashwood U',
    'Briarwood College','Thornwood University','Driftwood State','Firewood U',
    'Harewood College','Lakewood University','Crestwood State','Northwood U',
    'Southwood College','Eastwood University','Westwood State','Midwood U',
    'Bridgewater College','Stonewater University','Clearstone State','Ironstone U',
    'Goldfields College','Silverbrook University','Copperdale State','Bronzewood U',
    'Titanium College','Sterling University','Platinum State','Diamond U',
    'Sapphire College','Ruby University','Emerald State','Topaz U',
    'Opal College','Garnet University','Onyx State','Obsidian U'
  ];
  org_types TEXT[] := ARRAY['university','high_school','club','professional'];
BEGIN
  FOR org_i IN 1..100 LOOP
    INSERT INTO public.organizations (id, name, type, reminder_day)
    VALUES (
      ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
      org_names[org_i] || ' Athletics (Load Test)',
      org_types[((org_i - 1) % 4) + 1],
      (org_i % 7)
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- ── 2. 100 teams per org (10 000 teams total) ─────────────────────────────────

DO $$
DECLARE
  org_i  INT;
  team_i INT;
  sports TEXT[] := ARRAY[
    'Football','Basketball','Soccer','Volleyball','Swimming',
    'Track & Field','Tennis','Golf','Cross Country','Wrestling',
    'Baseball','Softball','Lacrosse','Field Hockey','Gymnastics',
    'Rowing','Water Polo','Ice Hockey','Rugby','Fencing',
    'Archery','Cycling','Equestrian','Sailing','Skiing',
    'Squash','Table Tennis','Triathlon','Ultimate Frisbee','Weightlifting',
    'Badminton','Boxing','Canoe','Climbing','Diving',
    'Handball','Judo','Karate','Kickboxing','Marathon',
    'Mixed Martial Arts','Polo','Powerlifting','Racquetball','Shooting',
    'Skateboarding','Surfing','Taekwondo','Beach Volleyball','Wheelchair Basketball',
    'Football B','Basketball B','Soccer B','Volleyball B','Swimming B',
    'Track B','Tennis B','Golf B','Cross Country B','Wrestling B',
    'Baseball B','Softball B','Lacrosse B','Field Hockey B','Gymnastics B',
    'Rowing B','Water Polo B','Ice Hockey B','Rugby B','Fencing B',
    'Archery B','Cycling B','Equestrian B','Sailing B','Skiing B',
    'Squash B','Table Tennis B','Triathlon B','Ultimate Frisbee B','Weightlifting B',
    'Badminton B','Boxing B','Canoe B','Climbing B','Diving B',
    'Handball B','Judo B','Karate B','Kickboxing B','Marathon B',
    'Football C','Basketball C','Soccer C','Volleyball C','Swimming C',
    'Track C','Tennis C','Golf C','Cross Country C','Wrestling C'
  ];
BEGIN
  FOR org_i IN 1..100 LOOP
    FOR team_i IN 1..100 LOOP
      INSERT INTO public.teams (id, organization_id, name, sport, active)
      VALUES (
        ('bbbbbbbb-' || lpad(org_i::text, 4, '0') || '-0000-' || lpad(team_i::text, 4, '0') || '-000000000001')::uuid,
        ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
        sports[team_i] || ' Team',
        sports[team_i],
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── 3. One coach per team (10 000 coaches) ────────────────────────────────────

DO $$
DECLARE
  org_i  INT;
  team_i INT;
  coach_names TEXT[] := ARRAY[
    'Alex','Blake','Casey','Dana','Evan','Fran','Glen','Hana',
    'Ivan','Jane','Kyle','Lena','Mike','Nina','Omar','Pam',
    'Quinn','Rosa','Sam','Tara','Ursa','Vera','Will','Xena',
    'Yale','Zoe','Arlo','Bree','Colt','Dune','Eric','Faye',
    'Greg','Hope','Iris','Jake','Kara','Luke','Mara','Nash',
    'Opal','Pete','Reba','Seth','Tess','Una','Vince','Wren',
    'Xyla','York','Zara','Adam','Beth','Cole','Dawn','Earl',
    'Fern','Gale','Holt','Isla','Joel','Kim','Lars','Milo',
    'Nora','Owen','Prue','Reid','Sara','Troy','Uma','Val',
    'Wade','Xan','Yara','Zeb','Abel','Blythe','Cruz','Dell',
    'Eben','Fox','Gray','Hayes','Ike','Jean','Knox','Lane',
    'Moss','Nell','Otto','Penn','Rex','Shaw','Ty','Upton',
    'Vail','West','Xio','Yul','Zola','Ace'
  ];
BEGIN
  FOR org_i IN 1..100 LOOP
    FOR team_i IN 1..100 LOOP
      INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
      VALUES (
        ('cccccccc-' || lpad(org_i::text, 4, '0') || '-0000-' || lpad(team_i::text, 4, '0') || '-000000000001')::uuid,
        ('cccccccc-' || lpad(org_i::text, 4, '0') || '-aaaa-' || lpad(team_i::text, 4, '0') || '-000000000001')::uuid,
        coach_names[((team_i - 1) % 100) + 1] || ' Coach',
        'coach_o' || org_i || '_t' || team_i || '@loadtest.edu',
        'coach',
        ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
        ('bbbbbbbb-' || lpad(org_i::text, 4, '0') || '-0000-' || lpad(team_i::text, 4, '0') || '-000000000001')::uuid,
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── 4. 100 athletes per team (1 000 000 total) ────────────────────────────────
-- athlete UUID: dddddddd-{org:4}-{team:4}-{ath:4}-000000000001

DO $$
DECLARE
  org_i  INT;
  team_i INT;
  ath_i  INT;
  first_names TEXT[] := ARRAY[
    'Jordan','Alex','Morgan','Taylor','Casey','Riley','Jamie','Drew',
    'Quinn','Blake','Avery','Parker','Hayden','Cameron','Reagan','Logan',
    'Skylar','Peyton','Reese','Kendall','Charlie','Finley','Rowan','Emery',
    'River','Phoenix','Sage','Remi','Kai','Dakota','Indigo','Shiloh',
    'Eden','Lane','Robin','Wren','Spencer','Lennon','Harper','Emerson',
    'Sloane','Paige','Briar','Sutton','Marlowe','Ellis','Harlow','Demi',
    'Jess','Lee','Ren','Bex','Kit','Ari','Ray','Skye','Cas','Noel',
    'Paz','Sol','Ira','Bay','Rue','Roy','Jan','Max','Kim','Pat',
    'Cam','Sky','Sam','Ash','Bly','Frey','Soren','Tal','Cyan','Jory',
    'Rook','Sable','Teal','Umber','Vance','Wynn','Zeal','Acer','Bard','Crest',
    'Dell','Echo','Flint','Gale','Heath','Isle','Jade','Kern','Lark','Marsh',
    'Nova','Onyx'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
    'Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin',
    'Thompson','Moore','Young','Allen','King','Wright','Scott','Torres',
    'Hill','Green','Adams','Baker','Nelson','Carter','Mitchell','Perez',
    'Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins',
    'Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy',
    'Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Peterson',
    'Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price',
    'Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry',
    'Powell','Long','Patterson','Hughes','Flores','Washington','Butler','Simmons',
    'Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes',
    'Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole',
    'West','Jordan','Owens','Reynolds','Fisher','Ellis'
  ];
BEGIN
  FOR org_i IN 1..100 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
        VALUES (
          ('dddddddd-' || lpad(org_i::text, 4, '0') || '-' || lpad(team_i::text, 4, '0') || '-' || lpad(ath_i::text, 4, '0') || '-000000000001')::uuid,
          ('dddddddd-' || lpad(org_i::text, 4, '0') || '-' || lpad(team_i::text, 4, '0') || '-' || lpad(ath_i::text, 4, '0') || '-aaaaaaaaaaaa')::uuid,
          first_names[((ath_i - 1) % 100) + 1] || ' ' || last_names[((ath_i - 1) % 100) + 1],
          'athlete_o' || org_i || '_t' || team_i || '_a' || ath_i || '@loadtest.edu',
          'athlete',
          ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
          ('bbbbbbbb-' || lpad(org_i::text, 4, '0') || '-0000-' || lpad(team_i::text, 4, '0') || '-000000000001')::uuid,
          true
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── 5. Admins (one per org, 100 total) ────────────────────────────────────────
-- Org 1 admin keeps the real auth_user_id for sjs25h@fsu.edu (dcaa449f-...)
-- Orgs 2-100 get fake auth_user_ids (no login without creating real auth users)

INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
VALUES (
  'eeeeeeee-0000-0000-0000-000000000001',
  'dcaa449f-74b1-493f-9eaa-3a6084a5ab68',
  'Load Test Admin',
  'admin@loadtest.edu',
  'admin',
  'aaaaaaaa-0000-0000-0000-000000000001',
  NULL,
  true
)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  org_i INT;
BEGIN
  FOR org_i IN 2..100 LOOP
    INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
    VALUES (
      ('eeeeeeee-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
      ('eeeeeeee-' || lpad(org_i::text, 4, '0') || '-aaaa-0000-000000000001')::uuid,
      'Admin Org ' || org_i,
      'admin_o' || org_i || '@loadtest.edu',
      'admin',
      ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text, 12, '0'))::uuid,
      NULL,
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- ── 6. 2 check-ins per athlete (2 000 000 rows) ───────────────────────────────
-- Split into 10-org batches via separate DO blocks to avoid statement timeout.
-- Each block = 10 orgs × 100 teams × 100 athletes × 2 = 200 000 rows.

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 1..10 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 11..20 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 21..30 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 31..40 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 41..50 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 51..60 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 61..70 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 71..80 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 81..90 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN 91..100 LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        ath_id  := ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid;
        team_id := ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid;
        base_health := 4.0 + (((org_i * 7 + team_i * 17 + ath_i * 31) % 60) / 10.0);
        FOR wk IN 0..1 LOOP
          e_score  := GREATEST(1, LEAST(10, base_health + ((org_i + team_i + ath_i + wk)     % 30 - 15) / 10.0));
          r_score  := GREATEST(1, LEAST(10, base_health + ((org_i * 2 + team_i + ath_i + wk) % 28 - 14) / 10.0));
          rc_score := GREATEST(1, LEAST(10, base_health + ((ath_i * 3 + team_i + org_i + wk) % 26 - 13) / 10.0));
          s_score  := GREATEST(1, LEAST(10, base_health + ((team_i + ath_i * 2 + org_i + wk) % 24 - 12) / 10.0));
          risk := CASE WHEN LEAST(e_score,r_score,rc_score,s_score) < 3 THEN 'red' WHEN LEAST(e_score,r_score,rc_score,s_score) < 5 THEN 'yellow' ELSE 'green' END;
          checkin_ts := NOW() - (wk * 7 + (ath_i % 7)) * INTERVAL '1 day' - ((team_i * 3 + ath_i) % 12) * INTERVAL '1 hour';
          INSERT INTO public.checkins (id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, risk_level, is_private, wants_followup, completed_at)
          VALUES (gen_random_uuid(), ath_id, team_id, 'weekly'::checkin_mode, e_score, r_score, rc_score, s_score, risk::risk_level, true, false, checkin_ts)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── 7. Alerts (~5% of athletes = ~50 000 alerts) ────────────────────────────

DO $$
DECLARE
  org_i  INT;
  team_i INT;
  ath_i  INT;
  ath_id UUID;
  tid    UUID;
  oid    UUID;
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
            'risk_score',
            'open'::alert_status,
            NOW() - ((org_i + team_i + ath_i) % 72) * INTERVAL '1 hour'
          )
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── Summary ───────────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM public.organizations WHERE id::text LIKE 'aaaaaaaa-%')  AS orgs,
  (SELECT count(*) FROM public.teams         WHERE id::text LIKE 'bbbbbbbb-%')  AS teams,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'dddddddd-%')  AS athletes,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'cccccccc-%')  AS coaches,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'eeeeeeee-%')  AS admins,
  (SELECT count(*) FROM public.checkins      WHERE athlete_id::text LIKE 'dddddddd-%') AS checkins,
  (SELECT count(*) FROM public.alerts        WHERE id::text LIKE '%')           AS alerts;
