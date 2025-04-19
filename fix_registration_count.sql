-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_registration_insert ON public.registrations;
DROP TRIGGER IF EXISTS on_registration_delete ON public.registrations;

-- Make sure the events table has a registered field with a default value of 0
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS registered INTEGER DEFAULT 0;

-- Update registered count for all existing events based on actual registrations count
UPDATE public.events e
SET registered = (
  SELECT COUNT(*) 
  FROM public.registrations r
  WHERE r.event_id = e.id
);

-- Create a more robust function to increment the registration count
CREATE OR REPLACE FUNCTION increment_event_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Use atomic update to increment the registered count for the event
  UPDATE public.events
  SET registered = registered + 1
  WHERE id = NEW.event_id;
  
  -- Return the result of the update to verify it worked
  RAISE NOTICE 'Updated event % registration count', NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call this function whenever a new registration is added
CREATE TRIGGER on_registration_insert
AFTER INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION increment_event_registration();

-- Create a more robust function to decrement the registration count
CREATE OR REPLACE FUNCTION decrement_event_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement the registered count for the event
  UPDATE public.events
  SET registered = GREATEST(registered - 1, 0)  -- Ensure it doesn't go below zero
  WHERE id = OLD.event_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call this function whenever a registration is deleted
CREATE TRIGGER on_registration_delete
AFTER DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION decrement_event_registration();

-- Create a check constraint to ensure registered count doesn't exceed capacity
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS check_registered_not_exceeding_capacity;

ALTER TABLE public.events
ADD CONSTRAINT check_registered_not_exceeding_capacity
CHECK (registered <= capacity);

-- Verify current registration counts for all events
SELECT id, name, capacity, registered, 
       (SELECT COUNT(*) FROM public.registrations r WHERE r.event_id = e.id) AS actual_registrations
FROM public.events e; 