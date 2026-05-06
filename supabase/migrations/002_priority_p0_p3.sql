-- Migrate task priority from high/medium/low to P0/P1/P2/P3
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

UPDATE tasks SET priority = CASE
  WHEN priority = 'high' THEN 'P1'
  WHEN priority = 'medium' THEN 'P2'
  WHEN priority = 'low' THEN 'P3'
  ELSE priority
END
WHERE priority IN ('high', 'medium', 'low');

ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('P0', 'P1', 'P2', 'P3'));
