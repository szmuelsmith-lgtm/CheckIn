#!/bin/bash
# ============================================================
# Load-test seed runner: 100 orgs × 100 teams × 100 athletes
#
# Splits into small batches to stay under Supabase's ~2-min
# statement timeout per management API call.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_... bash supabase/seed-load-test.sh
# ============================================================

set -e

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: set SUPABASE_ACCESS_TOKEN before running"
  exit 1
fi

run_sql() {
  local label="$1"
  local file="$2"
  echo -n "  $label ... "
  result=$(SUPABASE_ACCESS_TOKEN="$TOKEN" npx supabase db query --linked -f "$file" 2>&1)
  if echo "$result" | grep -q "unexpected status\|ERROR"; then
    echo "FAILED"
    echo "$result"
    exit 1
  fi
  echo "ok"
}

run_sql_inline() {
  local label="$1"
  local sql="$2"
  local tmpfile
  tmpfile=$(mktemp /tmp/seed_XXXXXX)
  mv "$tmpfile" "${tmpfile}.sql"
  tmpfile="${tmpfile}.sql"
  echo "$sql" > "$tmpfile"
  echo -n "  $label ... "
  result=$(SUPABASE_ACCESS_TOKEN="$TOKEN" npx supabase db query --linked -f "$tmpfile" 2>&1)
  rm -f "$tmpfile"
  if echo "$result" | grep -q "unexpected status\|ERROR"; then
    echo "FAILED"
    echo "$result"
    exit 1
  fi
  echo "ok"
}

echo "=== Load-test seed: 100 orgs × 100 teams × 100 athletes ==="
echo ""

# ── Step 1: Orgs, teams, coaches, admins ────────────────────
echo "[1/4] Structure (orgs, teams, coaches, admins)..."
run_sql "orgs + teams + coaches + admins" "supabase/seed-load-test-structure.sql"
echo ""

# ── Step 2: Athletes in batches of 5 orgs (50 000 rows each) ─
echo "[2/4] Athletes (50 batches × 2 orgs × 100 teams × 100 athletes = 1 000 000 rows)..."

athlete_sql() {
  local start=$1
  local end=$2
  cat <<SQL
DO \$\$
DECLARE
  org_i  INT; team_i INT; ath_i INT;
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
  FOR org_i IN ${start}..${end} LOOP
    FOR team_i IN 1..100 LOOP
      FOR ath_i IN 1..100 LOOP
        INSERT INTO public.profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded)
        VALUES (
          ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-000000000001')::uuid,
          ('dddddddd-' || lpad(org_i::text,4,'0') || '-' || lpad(team_i::text,4,'0') || '-' || lpad(ath_i::text,4,'0') || '-aaaaaaaaaaaa')::uuid,
          first_names[((ath_i - 1) % 100) + 1] || ' ' || last_names[((ath_i - 1) % 100) + 1],
          'athlete_o' || org_i || '_t' || team_i || '_a' || ath_i || '@loadtest.edu',
          'athlete',
          ('aaaaaaaa-0000-0000-0000-' || lpad(org_i::text,12,'0'))::uuid,
          ('bbbbbbbb-' || lpad(org_i::text,4,'0') || '-0000-' || lpad(team_i::text,4,'0') || '-000000000001')::uuid,
          true
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END \$\$;
SQL
}

for batch in $(seq 1 50); do
  start=$(( (batch - 1) * 2 + 1 ))
  end=$(( batch * 2 ))
  run_sql_inline "orgs ${start}-${end}" "$(athlete_sql $start $end)"
done
echo ""

# ── Step 3: Checkins in batches of 2 orgs ────────────────────
echo "[3/4] Checkins (50 batches × 2 orgs × 100 teams × 100 athletes × 2 = 2 000 000 rows total)..."

checkin_sql() {
  local start=$1
  local end=$2
  cat <<SQL
DO \$\$
DECLARE
  org_i INT; team_i INT; ath_i INT; wk INT;
  ath_id UUID; team_id UUID;
  e_score NUMERIC; r_score NUMERIC; rc_score NUMERIC; s_score NUMERIC;
  risk TEXT; checkin_ts TIMESTAMPTZ; base_health NUMERIC;
BEGIN
  FOR org_i IN ${start}..${end} LOOP
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
END \$\$;
SQL
}

for batch in $(seq 1 50); do
  start=$(( (batch - 1) * 2 + 1 ))
  end=$(( batch * 2 ))
  run_sql_inline "orgs ${start}-${end}" "$(checkin_sql $start $end)"
done
echo ""

# ── Step 4: Alerts ────────────────────────────────────────────
echo "[4/4] Alerts (~50 000 rows)..."
run_sql "alerts" "supabase/seed-load-test-alerts.sql"
echo ""

echo "=== Done! Verifying counts... ==="
SUPABASE_ACCESS_TOKEN="$TOKEN" npx supabase db query --linked -f supabase/seed-load-test-verify.sql 2>&1 | grep -v "warning\|boundary\|Initialising\|recommend\|getting-started\|new version"
