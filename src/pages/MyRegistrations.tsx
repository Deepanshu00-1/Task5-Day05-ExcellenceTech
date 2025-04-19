import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    date: string;
    category: string;
  };
}

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  capacity: number;
  registered: number;
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, [timeFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('registrations')
        .select(`
          id,
          event_id,
          user_id,
          created_at,
          event:events (
            id,
            name,
            date,
            category
          )
        `)
        .eq('user_id', user.id);

      if (timeFilter === 'upcoming') {
        query = query.gte('events.date', new Date().toISOString());
      } else if (timeFilter === 'past') {
        query = query.lt('events.date', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setRegistrations(data as Registration[]);
      if (data && data.length > 0) {
        fetchRecommendedEvents(data);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedEvents = async (userRegistrations: Registration[]) => {
    try {
      // Get unique categories from user's registrations
      const categories = [...new Set(userRegistrations.map(reg => reg.event.category))];
      
      if (categories.length === 0) return;

      // Fetch events from the same categories, excluding already registered ones
      const registeredEventIds = userRegistrations.map(reg => reg.event_id);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('category', categories)
        .not('id', 'in', `(${registeredEventIds.join(',')})`)
        .gte('date', new Date().toISOString())
        .lt('registered', 'capacity')
        .order('date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setRecommendedEvents(data);
    } catch (error) {
      console.error('Error fetching recommended events:', error);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      // Refresh registrations after cancellation
      fetchRegistrations();
    } catch (error) {
      console.error('Error canceling registration:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Registrations</h1>
        <Select
          value={timeFilter}
          onValueChange={setTimeFilter}
        >
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-700 border-zinc-700">
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Registrations Table */}
      <div className="rounded-md border border-zinc-700 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-white">Event Name</TableHead>
              <TableHead className="text-white">Category</TableHead>
              <TableHead className="text-white">Event Date</TableHead>
              <TableHead className="text-white">Registration Date</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id} className="border-zinc-700">
                <TableCell className="font-medium text-white">
                  <Link to={`/events/${registration.event_id}`} className="hover:underline">
                    {registration.event.name}
                  </Link>
                </TableCell>
                <TableCell className="text-gray-300">{registration.event.category}</TableCell>
                <TableCell className="text-gray-300">
                  {new Date(registration.event.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-gray-300">
                  {new Date(registration.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 text-white border-zinc-700">
                      <DialogHeader>
                        <DialogTitle>Cancel Registration</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Are you sure you want to cancel your registration for {registration.event.name}?
                          This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="mt-6">
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelRegistration(registration.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Cancel Registration
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  {loading ? 'Loading...' : 'No registrations found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recommended Events Section */}
      {recommendedEvents.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold text-white">Recommended Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedEvents.map((event) => (
              <Card key={event.id} className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>Category: {event.category}</p>
                    <p>Date: {new Date(event.date).toLocaleDateString()}</p>
                    <p>Available Spots: {event.capacity - event.registered}</p>
                    <Link to={`/events/${event.id}`}>
                      <Button className="w-full mt-4 bg-white text-black hover:bg-gray-100">
                        View Event
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 