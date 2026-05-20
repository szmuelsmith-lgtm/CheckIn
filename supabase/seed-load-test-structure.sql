-- Orgs, teams, coaches, admins (fast — no athlete rows here)

-- 100 organizations
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

-- 10 000 teams
DO $$
DECLARE
  org_i INT; team_i INT;
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
        ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid,
        ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid,
        sports[team_i] || ' Team',
        sports[team_i],
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 10 000 coaches
DO $$
DECLARE
  org_i INT; team_i INT;
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
    'Vail','West','Xio','Yul','Zola','Ace','Bay','Clay'
  ];
BEGIN
  FOR org_i IN 1..100 LOOP
    FOR team_i IN 1..100 LOOP
      INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
      VALUES (
        ('cccccccc-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid,
        ('cccccccc-' || lpad(org_i::text,4,'0') || '-aaaa-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid,
        coach_names[((team_i - 1) % 100) + 1] || ' Coach',
        'coach_o' || org_i || '_t' || team_i || '@loadtest.edu',
        'coach',
        ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid,
        ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid,
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 100 admins (org 1 keeps the real sjs25h@fsu.edu auth_user_id)
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
DECLARE org_i INT;
BEGIN
  FOR org_i IN 2..100 LOOP
    INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
    VALUES (
      ('eeeeeeee-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid,
      ('eeeeeeee-' || lpad(org_i::text,4,'0') || '-aaaa-0000-000000000001')::uuid,
      'Admin Org ' || org_i,
      'admin_o' || org_i || '@loadtest.edu',
      'admin',
      ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid,
      NULL,
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
