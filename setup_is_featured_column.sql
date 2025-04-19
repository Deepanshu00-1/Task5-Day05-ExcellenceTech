-- Add is_featured column to events table if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Set a couple of existing events as featured
-- This will update the first 2 events to be featured events if they exist
UPDATE events
SET is_featured = true
WHERE id IN (
    SELECT id FROM events ORDER BY date ASC LIMIT 2
); 