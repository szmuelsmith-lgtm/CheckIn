-- ============================================================
-- fix-questions.sql
-- Run this in the Supabase SQL editor to populate questions.
-- Safe to re-run — truncates and re-inserts.
-- ============================================================

-- 1. Ensure enums exist
DO $$ BEGIN CREATE TYPE checkin_mode AS ENUM ('weekly','screening'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pillar AS ENUM ('emotional','resilience','recovery','support'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ensure questions table exists
CREATE TABLE IF NOT EXISTS questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar     pillar NOT NULL,
  text       TEXT NOT NULL,
  sub_text   TEXT,
  low_label  TEXT NOT NULL DEFAULT 'Not at all',
  high_label TEXT NOT NULL DEFAULT 'Completely',
  min_val    INTEGER DEFAULT 1,
  max_val    INTEGER DEFAULT 10,
  modes      checkin_mode[] NOT NULL DEFAULT ARRAY['weekly','screening']::checkin_mode[],
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Disable RLS on questions (they are not sensitive — just question text)
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- 4. Clear and re-insert all 32 questions
TRUNCATE questions CASCADE;

INSERT INTO questions (pillar, text, sub_text, low_label, high_label, modes) VALUES
  -- EMOTIONAL (8)
  ('emotional', 'How settled do you feel inside right now?', 'Not whether everything is perfect — just whether there''s a baseline calm underneath it all.', 'Completely unsettled', 'Genuinely settled', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How much have difficult emotions been getting in the way this week?', 'Think about moments when feelings made it hard to focus, train, or connect with people.', 'Constantly getting in the way', 'Barely in the way at all', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How often did you feel genuinely okay — not just going through the motions?', 'There''s a difference between functioning and actually feeling alright. Which has it been?', 'Mostly going through motions', 'Genuinely okay most days', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How heavy has the weight of everything felt lately?', 'All the expectations, the pressure, the things you carry that others might not see.', 'Crushing weight', 'Feeling light and free', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How connected do you feel to things that usually bring you joy?', 'Hobbies, people, music, food — the stuff that normally lights you up.', 'Completely disconnected', 'Fully connected', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How much have you been able to let yourself feel things without pushing them down?', 'Not performing wellness — actually letting emotions land and move through you.', 'Blocking everything out', 'Letting it all land', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How often did you feel irritable or on edge this week for no clear reason?', 'That low-grade tension that makes small things feel bigger than they should.', 'Irritable almost constantly', 'Steady and even-keeled', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How much hope do you have about how things are going for you right now?', 'Not blind optimism — just a genuine sense that things can get better or stay good.', 'No hope at all', 'A lot of real hope', ARRAY['weekly','screening']::checkin_mode[]),
  -- RESILIENCE (8)
  ('resilience', 'When something went wrong this week, how well did you bounce back?', 'Think about a setback — a bad practice, a conflict, a disappointment. How did you handle it?', 'Stayed down for a long time', 'Got back up quickly', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How much did you adapt when things didn''t go as planned?', 'Flexibility under pressure — can you shift gears without it derailing you?', 'Fell apart when plans changed', 'Adapted with ease', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How confident are you in your ability to handle what''s in front of you?', 'Not arrogance — just a grounded belief that you have what it takes for this moment.', 'Not confident at all', 'Very confident', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How much did self-doubt slow you down this week?', 'The voice that says you''re not good enough, not ready, or going to fail.', 'Self-doubt was everywhere', 'Barely any self-doubt', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How well were you able to focus when it mattered most?', 'During practice, competition, or a big moment — was your mind with you or somewhere else?', 'Couldn''t focus at all', 'Locked in completely', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How much did you lean into difficulty instead of avoiding it this week?', 'The hard conversations, the tough workouts, the things you knew you needed to face.', 'Avoided everything hard', 'Leaned in fully', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How well did you manage stress without it spilling into other areas of your life?', 'Did the stress from one area — sport, school, relationships — stay contained, or did it spread?', 'Stress spilled into everything', 'Kept it well contained', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How much do you feel like yourself right now — your real self, not just who you show everyone?', 'Sometimes we perform a version of ourselves. This is asking about the real one.', 'Completely lost myself', 'Fully myself', ARRAY['weekly','screening']::checkin_mode[]),
  -- RECOVERY (8)
  ('recovery', 'How well has your body been recovering between training sessions or physically demanding days?', 'Soreness, fatigue, tightness — is your body getting what it needs to restore?', 'Not recovering at all', 'Recovering really well', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How has your sleep been this week?', 'Both quality and quantity. Waking up rested, or dragging yourself out of bed every morning?', 'Terrible sleep all week', 'Sleeping great', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How well have you been eating in a way that actually fuels you?', 'Not about perfection — just whether your nutrition is supporting how you''re trying to live.', 'Barely fueling myself', 'Fueling myself well', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How much time have you had to genuinely rest — not scroll, not train, just rest?', 'Downtime that actually feels like downtime. Your nervous system off the hook.', 'No real rest at all', 'Plenty of real rest', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How is your energy throughout the day compared to your baseline?', 'Not your best-ever energy — just compared to your normal. High, low, or somewhere in between?', 'Way below my baseline', 'At or above my baseline', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How much has physical discomfort — pain, tightness, illness — been affecting your day-to-day?', 'This could be an old injury, a nagging soreness, or just feeling physically off.', 'Really affecting everything', 'Not affecting me at all', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How well have you been protecting your mental rest — time away from pressure and performance?', 'The mental load of being an athlete or student is real. Are you getting breaks from it?', 'No mental rest whatsoever', 'Protecting it really well', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How would you rate your overall sense of physical readiness heading into this coming week?', 'All things considered — body, energy, sleep — how prepared do you feel physically?', 'Running on empty', 'Feeling ready and restored', ARRAY['weekly','screening']::checkin_mode[]),
  -- SUPPORT (10)
  ('support', 'How supported do you feel by the people around you right now?', 'The sense that if things got hard, someone would be in your corner.', 'Completely alone in this', 'Fully supported', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How easy has it felt to open up to someone you trust this week?', 'Not whether you did — just whether it felt possible or accessible.', 'Impossible to open up', 'Very easy to open up', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How connected do you feel to your teammates or peers right now?', 'That sense of being part of something, not just physically present but actually in it together.', 'Isolated from everyone', 'Deeply connected', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How much do you feel like the people around you actually understand what you''re going through?', 'Not just support in principle, but real understanding — someone who gets it.', 'Nobody understands', 'People really get it', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How safe do you feel being honest about how you''re really doing — not the polished version?', 'Whether it''s with a coach, teammate, friend, or family member. Is there a safe place for the truth?', 'Not safe to be honest anywhere', 'Very safe to be real', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How much have you felt like a burden to others when you needed something this week?', 'That feeling that asking for help is too much, that you shouldn''t need it.', 'Felt like a burden constantly', 'Didn''t feel like a burden at all', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How well are your relationships outside of sport or school holding up?', 'Family, close friends, people who know you as more than your role or performance.', 'Those relationships are struggling', 'Those relationships are strong', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'If you needed real help right now — emotional, practical, or both — do you know who you''d go to?', 'Not hypothetically — is there an actual person you could call or text today?', 'No idea who I''d reach out to', 'I know exactly who to call', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How genuinely seen do you feel — not just acknowledged, but actually understood by someone right now?', 'The difference between someone nodding along and someone who truly gets what you''re carrying.', 'Completely invisible', 'Truly seen and understood', ARRAY['weekly','screening']::checkin_mode[]),
  ('support', 'How easily can you ask for help before things get to a crisis point?', 'The ability to reach out early — not just when things have already fallen apart.', 'Can only ask when desperate', 'Can ask anytime, no shame', ARRAY['weekly','screening']::checkin_mode[]);

-- 5. Add the 8 new questions for emotional and resilience and recovery pillars
INSERT INTO questions (pillar, text, sub_text, low_label, high_label, modes) VALUES
  -- EMOTIONAL (2 new — total 10)
  ('emotional', 'How much have you been worrying about things outside your control this week?', 'The gap between what you can actually influence and where your mental energy is going.', 'Consumed by things I can''t control', 'Focused only on what I can control', ARRAY['weekly','screening']::checkin_mode[]),
  ('emotional', 'How at peace are you with where you stand in your own life — without comparing to others?', 'A sense that you''re on your own path and it''s okay, without measuring against teammates or peers.', 'Constantly measuring myself against others', 'At peace with my own path', ARRAY['weekly','screening']::checkin_mode[]),
  -- RESILIENCE (2 new — total 10)
  ('resilience', 'How clearly can you think when you''re under real pressure?', 'Not in calm moments — specifically when the stakes are high and time is short.', 'Mind goes completely blank', 'Think clearest under pressure', ARRAY['weekly','screening']::checkin_mode[]),
  ('resilience', 'How well have you stayed motivated when results haven''t matched your effort?', 'The grind periods when nothing seems to be paying off but you have to keep going anyway.', 'Lost all motivation', 'Still fully motivated', ARRAY['weekly','screening']::checkin_mode[]),
  -- RECOVERY (2 new — total 10)
  ('recovery', 'How well have you been listening to what your body is actually asking for?', 'Not just following a plan — genuinely tuning in to signals about rest, movement, food, and care.', 'Completely ignoring my body', 'Listening closely and responding', ARRAY['weekly','screening']::checkin_mode[]),
  ('recovery', 'How much has screen time or social media been getting in the way of winding down?', 'Scrolling before bed, comparison content, or anything that keeps your mind racing at night.', 'Really hurting my recovery', 'Not affecting my recovery at all', ARRAY['weekly','screening']::checkin_mode[]);

-- 5. Verify
SELECT COUNT(*) as total, pillar FROM questions GROUP BY pillar ORDER BY pillar;
