-- 1. SQL QUERY TO FETCH EVENT DETAILS BY ID
-- Replace EVENT_ID with the actual event ID
SELECT *
FROM public.events
WHERE id = 'EVENT_ID';

-- 2. SQL QUERY TO FETCH COMMENTS FOR AN EVENT
-- Replace EVENT_ID with the actual event ID
SELECT 
  ec.id,
  ec.user_id,
  ec.event_id,
  ec.content,
  ec.created_at,
  json_build_object(
    'name', p.name
  ) as user
FROM 
  public.event_comments ec
JOIN
  public.profiles p ON ec.user_id = p.user_id
WHERE 
  ec.event_id = 'EVENT_ID'
ORDER BY 
  ec.created_at DESC;

-- 3. SQL QUERY TO CHECK IF USER HAS FAVORITED AN EVENT
-- Replace USER_ID and EVENT_ID with actual values
SELECT id
FROM public.favorites
WHERE user_id = 'USER_ID'
AND event_id = 'EVENT_ID';

-- 4. SQL QUERY TO REGISTER A USER FOR AN EVENT
-- Replace USER_ID and EVENT_ID with actual values
INSERT INTO public.registrations (
  user_id,
  event_id,
  name,
  email
) VALUES (
  'USER_ID',
  'EVENT_ID',
  'User Name',
  'user@example.com'
);

-- 5. SQL QUERY TO UPDATE THE EVENT'S REGISTERED COUNT
-- This is handled by the trigger we created earlier in create_all_tables.sql
-- The trigger automatically increments the registered count when a new registration is added
-- But if you needed to manually update it:
UPDATE public.events
SET registered = registered + 1
WHERE id = 'EVENT_ID';

-- 6. SQL QUERY TO CHECK REGISTRATION STATUS
-- Check if a user is already registered for an event
SELECT id
FROM public.registrations
WHERE user_id = 'USER_ID'
AND event_id = 'EVENT_ID';

-- 7. SQL QUERY TO GET EVENT CAPACITY AND CURRENT REGISTRATIONS
-- Useful to check if the event is full
SELECT 
  capacity,
  registered,
  (capacity - registered) as spots_left,
  (registered >= capacity) as is_full
FROM 
  public.events
WHERE 
  id = 'EVENT_ID'; 