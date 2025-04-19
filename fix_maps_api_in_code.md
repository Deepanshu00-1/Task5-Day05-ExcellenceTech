# Fix Google Maps API in the Event Details Page

You will also need to update your Google Maps API key in the `src/pages/EventDetails.tsx` file. Here's how to do it:

## Option 1: Update directly in the code
1. Open `src/pages/EventDetails.tsx`
2. Find this line around line 303:
   ```jsx
   src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${event.coordinates.lat},${event.coordinates.lng}`}
   ```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps API key

## Option 2: Create a utility function that loads the key from the database
1. Create a new file at `src/lib/appSettings.ts`:
   ```typescript
   import { supabase } from './supabaseClient';

   export async function getAppSetting(key: string): Promise<string | null> {
     try {
       const { data, error } = await supabase
         .from('app_settings')
         .select('value')
         .eq('key', key)
         .single();
         
       if (error) {
         console.error('Error fetching app setting:', error);
         return null;
       }
       
       return data?.value || null;
     } catch (error) {
       console.error('Error in getAppSetting:', error);
       return null;
     }
   }
   ```

2. Then update `src/pages/EventDetails.tsx` to use this function:
   ```jsx
   // Add this state and effect at the top of your component
   const [mapsApiKey, setMapsApiKey] = useState('');
   
   useEffect(() => {
     const loadMapsKey = async () => {
       const key = await getAppSetting('GOOGLE_MAPS_API_KEY');
       if (key) setMapsApiKey(key);
     };
     loadMapsKey();
   }, []);
   
   // Then in your iframe, replace the hardcoded key with the state variable
   src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${event.coordinates.lat},${event.coordinates.lng}`}
   ```

## Note
If you don't have a Google Maps API key, the map won't display properly. You can:
1. Get a key from [Google Cloud Platform](https://console.cloud.google.com/)
2. Enable Maps Embed API in your Google Cloud account
3. Use the key in your application 