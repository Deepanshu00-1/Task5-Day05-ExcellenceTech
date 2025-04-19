-- The error in EventDetails.tsx is related to type issues with processing comment data
-- This query shows how the real data structure of the query result should look

-- Example of how the event_comments joint query returns data
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
LIMIT 1;

-- The fix in EventDetails.tsx should handle this structure correctly
-- The code already has the right interface:

/*
interface Comment {
  id: string;
  user_id: string; 
  event_id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
  };
}
*/

-- The problem is in the transformation:
-- Change from:
/*
const transformedComments = data?.map(comment => ({
  ...comment,
  user: { name: comment.user.name }
})) || [];
*/

-- To:
/*
const transformedComments = data || [];
*/ 