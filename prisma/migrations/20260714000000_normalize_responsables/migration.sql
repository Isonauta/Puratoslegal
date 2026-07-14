-- Normalize responsable values to the two known assignees.
-- Step 1: map obvious Sebastián variants
UPDATE "LegalRequirement"
SET responsable = 'Sebastián Corrotea'
WHERE responsable ILIKE '%sebastian%corrotea%'
   OR responsable ILIKE '%sebastián%corrotea%';

-- Step 2: map obvious Benjamín variants
UPDATE "LegalRequirement"
SET responsable = 'Benjamín Henriquez'
WHERE responsable ILIKE '%benj%henriquez%'
   OR responsable ILIKE '%benjamin%henriquez%';

-- Step 3: anything still not one of the two valid values → NULL
UPDATE "LegalRequirement"
SET responsable = NULL
WHERE responsable IS NOT NULL
  AND responsable NOT IN ('Sebastián Corrotea', 'Benjamín Henriquez');

-- Same normalization for ActionPlan
UPDATE "ActionPlan"
SET responsable = 'Sebastián Corrotea'
WHERE responsable ILIKE '%sebastian%corrotea%'
   OR responsable ILIKE '%sebastián%corrotea%';

UPDATE "ActionPlan"
SET responsable = 'Benjamín Henriquez'
WHERE responsable ILIKE '%benj%henriquez%'
   OR responsable ILIKE '%benjamin%henriquez%';

UPDATE "ActionPlan"
SET responsable = NULL
WHERE responsable IS NOT NULL
  AND responsable NOT IN ('Sebastián Corrotea', 'Benjamín Henriquez');
