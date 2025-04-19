import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

type Event = {
  id: string;
  name: string;
  category?: string;
  date: string;
  description?: string;
  is_featured: boolean;
};

export default function HeaderHero() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  async function fetchFeaturedEvents() {
    setLoading(true);
    const { data } = await supabase
  .from('events')
  .select('*')
  .eq('is_featured', true)
  .order('date', { ascending: true })
  .limit(3);

    setEvents(data || []);
    setLoading(false);
  }

  const filtered = events.filter(evt => {
    const term = search.toLowerCase();
    return (
      evt.name.toLowerCase().includes(term) ||
      (evt.category?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <div className="p-8 bg-background min-h-screen space-y-12">
      {/* Hero Section */}
      <Card className="bg-secondary p-12 text-center text-white">
        <CardHeader>
          <CardTitle className="text-5xl">Discover Events</CardTitle>
          <CardDescription className="mt-4">
            Explore our featured events and find what inspires you
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button size="lg">Explore Now</Button>
        </CardFooter>
      </Card>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <Input
          placeholder="Search by name or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Featured Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center">No events found.</p>
        ) : (
          filtered.map(evt => (
            <Card key={evt.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{evt.name}</CardTitle>
                  {evt.category && (
                    <Badge variant="outline">{evt.category}</Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(evt.date), 'MMMM d, yyyy')}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {evt.description || 'No description available.'}
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Register</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
