-- First, find your user ID
SELECT 
  au.id as user_id, 
  au.email, 
  p.is_organizer
FROM 
  auth.users au
LEFT JOIN 
  public.profiles p ON au.id = p.user_id;

-- After running the above query, find your user ID and replace USER_ID with it in the query below

-- Make yourself an organizer (replace USER_ID with your actual user ID)
UPDATE 
  public.profiles 
SET 
  is_organizer = TRUE 
WHERE 
  user_id = '9f9f2b54-1a61-403d-a522-cffb22c8f51a';

-- Example with a real UUID:
-- UPDATE public.profiles SET is_organizer = TRUE WHERE user_id = '335499ea-fe9f-4899-9dc1-af659770f048'; 