-- Enable citext extension for case-insensitive text comparison
CREATE EXTENSION IF NOT EXISTS citext;

-- Change Category.name to citext for case-insensitive uniqueness
-- The init migration created a unique INDEX (not a constraint), so drop the index
DROP INDEX IF EXISTS "Category_userId_name_key";
ALTER TABLE "Category" ALTER COLUMN "name" TYPE citext;
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- Add composite sort index for default task list query:
-- WHERE userId = ? ORDER BY status ASC, dueDate ASC NULLS LAST
CREATE INDEX "Task_userId_status_dueDate_idx" ON "Task"("userId", "status", "dueDate");
