-- Fix infinite recursion in the registrations policy

-- First drop the problematic policy
DROP POLICY IF EXISTS "Registrations are viewable by event participants" ON public.registrations;

-- Recreate it with the correct non-recursive condition
CREATE POLICY "Registrations are viewable by event participants" 
  ON public.registrations FOR SELECT
  USING (
    -- Check if the user is a participant in this specific event
    auth.uid() IN (
      SELECT user_id FROM public.registrations 
      WHERE event_id = registrations.event_id
    )
    OR
    -- Check if the user is the organizer of this event
    auth.uid() IN (
      SELECT organizer_id FROM public.events 
      WHERE id = registrations.event_id
    )
  );

-- Verify the policy was created correctly
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies 
WHERE 
  tablename = 'registrations'; 