import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, ArrowRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { isUserOrganizer } from '@/lib/utils';

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  capacity: number;
  registered: number;
  is_featured: boolean;
}

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFeaturedEvents, setFilteredFeaturedEvents] = useState<Event[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    setIsOrganizer(isUserOrganizer());
  }, []);

  useEffect(() => {
    // Filter featured events when search query changes
    setFilteredFeaturedEvents(
      featuredEvents.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, featuredEvents]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch featured events
      const { data: featuredData, error: featuredError } = await supabase
        .from('events')
        .select('*')
        .eq('is_featured', true)
        .limit(2);

      if (featuredError) throw featuredError;
      setFeaturedEvents(featuredData || []);
      setFilteredFeaturedEvents(featuredData || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clean, simple event card with gray/white color scheme
  const renderEventCard = (event: Event) => (
    <Card
      key={event.id}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all duration-300"
    >
      <CardHeader className="space-y-4 p-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-white">
              {event.name}
            </CardTitle>
            <Badge className="bg-zinc-800 text-gray-200 rounded-md border border-zinc-700">
              {event.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{event.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-3">
        <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed">{event.description}</p>
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="h-4 w-4" />
            <span>{event.registered} / {event.capacity} registered</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Capacity</span>
            <span>{Math.round((event.registered / event.capacity) * 100)}%</span>
          </div>
          <Progress 
            value={(event.registered / event.capacity) * 100} 
            className="h-2 bg-zinc-800"
          />
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-2">
        <Link to={`/events/${event.id}`} className="w-full">
          <Button 
            variant="outline" 
            className="w-full border border-zinc-700 text-white hover:bg-white hover:text-zinc-900 transition-all duration-300"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  return (
    <ScrollArea className="h-full bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800">
          <CardContent className="relative text-center py-24 px-6 sm:py-32 sm:px-12 space-y-8">
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                Discover Amazing Events
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Join the most exciting experiences near you and connect with like-minded people
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Link to="/events">
                <Button 
                  size="lg" 
                  className="bg-white text-zinc-900 hover:bg-gray-200 font-medium w-full sm:w-auto"
                >
                  Explore Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {isOrganizer && (
                <Link to="/events">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-zinc-700 text-white hover:bg-zinc-800 w-full sm:w-auto"
                  >
                    Create Event
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </div>

        {/* Search */}
        <div>
          <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-6 bg-zinc-800 border-zinc-700 placeholder-gray-500 text-white rounded-lg w-full text-lg focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Events */}
        <section>
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Featured Events
            </h2>
            <p className="text-gray-400 text-lg">Handpicked experiences you'll love</p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading featured events...</div>
          ) : filteredFeaturedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {filteredFeaturedEvents.map(renderEventCard)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              {searchQuery ? "No featured events match your search" : "No featured events available"}
            </div>
          )}

          <div className="flex justify-center pt-12 mt-4">
            <Link to="/events">
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-gray-200 font-medium"
              >
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
