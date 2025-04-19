-- Script to check and fix event coordinates for proper display
-- This fixes any map display issues in the event details page

-- 1. First, check if events have the right coordinates structure
SELECT 
  id, 
  name, 
  coordinates
FROM 
  public.events
WHERE 
  coordinates IS NULL OR 
  coordinates = '{}' OR
  (NOT JSONB_TYPEOF(coordinates) = 'object') OR
  (NOT JSONB_EXISTS(coordinates, 'lat') OR NOT JSONB_EXISTS(coordinates, 'lng'));

-- 2. Fix any events with missing or incorrect coordinates
-- This uses default NYC coordinates (40.7128, -74.0060)
UPDATE public.events
SET coordinates = '{"lat": 40.7128, "lng": -74.0060}'::JSONB
WHERE 
  coordinates IS NULL OR 
  coordinates = '{}' OR
  (NOT JSONB_TYPEOF(coordinates) = 'object') OR
  (NOT JSONB_EXISTS(coordinates, 'lat') OR NOT JSONB_EXISTS(coordinates, 'lng'));

-- 3. Make sure the coordinates column is a JSONB type
ALTER TABLE public.events
ALTER COLUMN coordinates TYPE JSONB USING coordinates::JSONB;

-- 4. Update the Google Maps API key in a new environment variable table if needed
-- Create table for environment variables if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- You can set your Google Maps API key here
-- Replace YOUR_GOOGLE_MAPS_API_KEY with your actual key
INSERT INTO public.app_settings (key, value)
VALUES ('GOOGLE_MAPS_API_KEY', 'YOUR_GOOGLE_MAPS_API_KEY')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 5. Verify the fixed events
SELECT 
  id, 
  name, 
  coordinates,
  coordinates->'lat' as latitude,
  coordinates->'lng' as longitude
FROM 
  public.events
ORDER BY 
  created_at DESC
LIMIT 10; 