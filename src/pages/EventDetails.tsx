import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Send, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getAppSetting } from '@/lib/appSettings';
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
  coordinates: {
    lat: number;
    lng: number;
  };
}

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

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
  });
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchComments();
    checkFavoriteStatus();
    loadMapsApiKey();
    setIsOrganizer(isUserOrganizer());
  }, [id]);

  const loadMapsApiKey = async () => {
    const key = await getAppSetting('GOOGLE_MAPS_API_KEY');
    if (key) setMapsApiKey(key);
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      // Get comments for this event
      const { data: commentsData, error: commentsError } = await supabase
        .from('event_comments')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }
      
      // If no comments, set empty array and return
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }
      
      // Get all user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Still show comments but with unknown users
        const commentsWithUnknownUsers = commentsData.map(comment => ({
          ...comment,
          user: { name: 'Unknown User' }
        }));
        setComments(commentsWithUnknownUsers);
        return;
      }
      
      // Create user ID to name mapping
      const userMap: Record<string, string> = {};
      profilesData.forEach(profile => {
        userMap[profile.user_id] = profile.name;
      });
      
      // Combine comments with user info
      const commentsWithUsers = commentsData.map(comment => ({
        ...comment,
        user: {
          name: userMap[comment.user_id] || 'Unknown User'
        }
      }));
      
      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error in fetchComments:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', id);

        if (error) throw error;
        setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, event_id: id });

        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to post comments');
        return;
      }

      // Insert the comment
      const { error } = await supabase
        .from('event_comments')
        .insert({
          user_id: user.id,
          event_id: id,
          content: newComment.trim()
        });

      if (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment');
        return;
      }

      // Clear the input
      setNewComment('');
      
      // Refresh comments
      fetchComments();
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to register for events');
        return;
      }

      // Check if event is already full
      if (event && event.registered >= event.capacity) {
        alert('This event is full and cannot accept more registrations');
        return;
      }

      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: id,
          name: registrationForm.name,
          email: registrationForm.email,
        });

      if (error) {
        console.error('Error registering for event:', error);
        alert('Failed to register for event');
        return;
      }

      // Clear form
      setRegistrationForm({
        name: '',
        email: '',
      });

      // Refresh event details to update registration count
      fetchEventDetails();
      
      alert('Successfully registered for the event!');
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const registerButton = () => {
    if (isOrganizer) {
      return (
        <Button 
          className="w-full mt-6 bg-zinc-600 text-white hover:bg-zinc-600 cursor-not-allowed"
          disabled={true}
        >
          Organizers Cannot Register
        </Button>
      );
    }
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full mt-6 bg-white text-black hover:bg-gray-100"
            disabled={Boolean(event && event.registered >= event.capacity)}
          >
            {event && event.registered >= event.capacity ? 'Event Full' : 'Register Now'}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle>Register for {event?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Fill out the form below to register for this event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={registrationForm.name}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={registrationForm.email}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-100">
                Complete Registration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  const breadcrumbSegments = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: event.name, path: `/events/${event.id}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb segments={breadcrumbSegments} className="mb-8" />
      
      <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-700">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-white">{event.name}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className={cn(
              "text-gray-400 hover:text-white",
              isFavorited && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
          </Button>
        </div>

        <div className="space-y-8 text-gray-300">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
            <p>{event.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-gray-400">Category</dt>
                  <dd>{event.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Date</dt>
                  <dd>{new Date(event.date).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Location</dt>
                  <dd>{event.location}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Registration Status</dt>
                  <dd className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{event.registered} / {event.capacity} registered</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Capacity</span>
                        <span>{Math.round((event.registered / event.capacity) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(event.registered / event.capacity) * 100}
                        className="bg-zinc-700"
                      />
                    </div>
                  </dd>
                </div>
              </dl>

              {/* Register Button */}
              {registerButton()}
            </div>

            {/* Map */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Location</h2>
              <div className="aspect-video rounded-lg overflow-hidden border border-zinc-700">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey || 'YOUR_GOOGLE_MAPS_API_KEY'}&q=${event.coordinates.lat},${event.coordinates.lng}`}
                />
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-white mb-6">Comments</h2>
            
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment... (max 280 characters)"
                  maxLength={280}
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button type="submit" variant="outline" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-white">{comment.user.name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 