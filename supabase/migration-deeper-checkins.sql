-- Migration: Deeper check-in questions
-- Adds holistic life-dimension scores to the checkins table
-- Run this against your Supabase database

-- Drop old columns
ALTER TABLE checkins DROP COLUMN IF EXISTS family_stress_score;
ALTER TABLE checkins DROP COLUMN IF EXISTS relationship_stress_score;

-- Add new life-dimension columns
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS family_score INTEGER CHECK (family_score BETWEEN 1 AND 10);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS social_score INTEGER CHECK (social_score BETWEEN 1 AND 10);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS spiritual_score INTEGER CHECK (spiritual_score BETWEEN 1 AND 10);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS academic_score INTEGER CHECK (academic_score BETWEEN 1 AND 10);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS athletic_confidence_score INTEGER CHECK (athletic_confidence_score BETWEEN 1 AND 10);

-- Add comments for documentation
COMMENT ON COLUMN checkins.family_score IS 'Family & home life wellness (1=struggling, 10=thriving). Shown if athlete enables family check-ins.';
COMMENT ON COLUMN checkins.social_score IS 'Social connection & relationships (1=isolated, 10=connected).';
COMMENT ON COLUMN checkins.spiritual_score IS 'Spiritual/inner life wellness (1=disconnected, 10=grounded). Shown if athlete enables faith support.';
COMMENT ON COLUMN checkins.academic_score IS 'Academic life management (1=falling behind, 10=on top of it).';
COMMENT ON COLUMN checkins.athletic_confidence_score IS 'Athletic confidence & motivation (1=doubting, 10=confident).';
