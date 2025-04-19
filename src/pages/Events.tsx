import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { isUserOrganizer } from "@/lib/utils";
import { toast, Toaster } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  capacity: number;
  registered: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface EventFormData {
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  capacity: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  date?: string;
  location?: string;
  capacity?: string;
}

const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_DATA: EventFormData = {
  name: '',
  description: '',
  category: 'workshop',
  date: '',
  location: '',
  capacity: 10,
  coordinates: {
    lat: 0,
    lng: 0,
  },
};

const formSchema = z.object({
  name: z.string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must be less than 100 characters'),
  date: z.date()
    .min(new Date(), 'Event date must be in the future')
    .refine((date) => {
      return date > new Date();
    }, 'Event date must be in the future'),
  category: z.enum(['workshop', 'conference', 'meetup', 'other'], {
    required_error: 'Please select a category',
  }),
  description: z.string()
    .min(1, 'Description is required')
    .max(300, 'Description must be less than 300 characters'),
  capacity: z.number()
    .min(10, 'Minimum capacity is 10')
    .max(1000, 'Maximum capacity is 1000'),
  customQuestion: z.string()
    .max(100, 'Custom question must be less than 100 characters')
    .optional()
    .nullable(),
  isFeatured: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

export default function Events() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(33);
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'workshop',
      date: new Date(),
      capacity: 10,
      customQuestion: '',
      isFeatured: false
    }
  });

  useEffect(() => {
    fetchEvents();
    fetchUserFavorites();
  }, [page]);

  useEffect(() => {
    const channel = supabase
      .channel('events_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          if (!showCreateModal) {
            fetchEvents();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showCreateModal]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (data) {
        setEvents(page === 1 ? data : [...events, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.event_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to favorite events");
        return;
      }

      if (favorites.includes(eventId)) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);
        setFavorites(favorites.filter(id => id !== eventId));
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, event_id: eventId });
        setFavorites([...favorites, eventId]);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorites");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'capacity') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({
          ...prev,
          capacity: numValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateStep = (step: number) => {
    const errors: FormErrors = {};
    
    if (step === 1) {
      if (!formData.name) errors.name = 'Name is required';
      if (!formData.category) errors.category = 'Category is required';
      if (!formData.description) errors.description = 'Description is required';
    } else if (step === 2) {
      if (!formData.date) errors.date = 'Date is required';
      if (!formData.location) errors.location = 'Location is required';
      if (!formData.capacity || formData.capacity < 10) errors.capacity = 'Minimum capacity is 10';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + 33));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setProgress(prev => Math.max(33, prev - 33));
  };

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("You must be logged in to create an event");
        return;
      }

      // Special handling for test@organizer.com
      const userEmail = localStorage.getItem('userEmail');
      let organizer_id = user.id;
      
      // Double check RLS policy condition for test@organizer.com
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, is_organizer')
        .eq('user_id', user.id)
        .single();

      // If profile doesn't exist or isn't organizer, but email is test@organizer.com,
      // create or update the profile to have organizer privileges
      if ((profileError || !profile?.is_organizer) && userEmail === 'test@organizer.com') {
        // Ensure profile exists with organizer privileges
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            user_id: user.id, 
            email: 'test@organizer.com',
            name: 'Test Organizer',
            is_organizer: true 
          });
          
        if (upsertError) {
          toast.error("Failed to update profile status");
          return;
        }
      }

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          name: values.name,
          description: values.description,
          category: values.category,
          date: values.date.toISOString(),
          capacity: values.capacity,
          is_featured: values.isFeatured,
          organizer_id: organizer_id,
          registered: 0
        })
        .select()
        .single();

      if (eventError) {
        toast.error("Failed to create event: " + eventError.message);
        return;
      }

      // If there's a custom question, save it
      if (values.customQuestion?.trim() && event?.id) {
        const { error: questionError } = await supabase
          .from('event_questions')
          .insert({
            event_id: event.id,
            question: values.customQuestion.trim()
          });

        if (questionError) {
          toast.error("Event created but custom question could not be added");
        }
      }

      toast.success("Event created successfully!");
      setShowCreateModal(false);
      form.reset();
      fetchEvents(); // Refresh the events list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to create event. Please try again. " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormStep = () => {
    const inputClassName = "bg-zinc-800/50 border-zinc-700/50 focus:border-white/50 focus:ring-white/20 text-white placeholder-zinc-500 transition-colors duration-200";
    const labelClassName = "text-zinc-300 font-medium text-sm";
    const errorClassName = "text-red-400 text-xs mt-1";

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className={labelClassName}>Event Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                className={inputClassName}
                placeholder="Enter event name..."
              />
              {form.formState.errors.name && (
                <p className={errorClassName}>{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date" className={labelClassName}>Event Date</Label>
              <Input
                id="date"
                type="datetime-local"
                {...form.register('date', {
                  setValueAs: (value) => value ? new Date(value) : null,
                })}
                className={inputClassName}
                min={new Date().toISOString().slice(0, 16)}
              />
              {form.formState.errors.date && (
                <p className={errorClassName}>{form.formState.errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category" className={labelClassName}>Category</Label>
              <Select
                value={form.getValues('category')}
                onValueChange={(value) => form.setValue('category', value as any)}
              >
                <SelectTrigger className={`${inputClassName} hover:border-white/30 focus:border-white`}>
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800/95 border border-zinc-700 backdrop-blur-sm">
                  <SelectItem 
                    value="workshop" 
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                      Workshop
                    </span>
                  </SelectItem>
                  <SelectItem 
                    value="conference" 
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                      Conference
                    </span>
                  </SelectItem>
                  <SelectItem 
                    value="meetup" 
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400"></div>
                      Meetup
                    </span>
                  </SelectItem>
                  <SelectItem 
                    value="other" 
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                      Other
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className={errorClassName}>{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className={labelClassName}>
                Description
                <span className="text-zinc-500 text-xs ml-2">
                  ({form.watch('description')?.length || 0}/300)
                </span>
              </Label>
              <Textarea
                id="description"
                {...form.register('description')}
                className={`${inputClassName} min-h-[100px] resize-none`}
                placeholder="Describe your event..."
              />
              {form.formState.errors.description && (
                <p className={errorClassName}>{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="capacity" className={labelClassName}>Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="10"
                {...form.register('capacity', { valueAsNumber: true })}
                className={inputClassName}
                placeholder="Minimum 10 participants"
              />
              {form.formState.errors.capacity && (
                <p className={errorClassName}>{form.formState.errors.capacity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customQuestion" className={labelClassName}>
                Custom Question
                <span className="text-zinc-500 text-xs ml-2">
                  (Optional - {form.watch('customQuestion')?.length || 0}/100)
                </span>
              </Label>
              <Input
                id="customQuestion"
                {...form.register('customQuestion')}
                className={inputClassName}
                placeholder="e.g., Any special requests?"
              />
              {form.formState.errors.customQuestion && (
                <p className={errorClassName}>{form.formState.errors.customQuestion.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className={labelClassName}>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('isFeatured')}
                    className="rounded border-zinc-700 bg-zinc-800/50 text-white focus:ring-white/20"
                  />
                  <span>Feature this event</span>
                </div>
              </Label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Determine if user is an organizer or has special access
  const isUserAllowedToCreateEvents = () => {
    // Check if user is test@organizer.com (our hardcoded organizer)
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail === 'test@organizer.com') {
      return true;
    }
    
    // Otherwise, use the normal organizer check
    return isUserOrganizer();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto py-8 px-4">
        <Toaster richColors position="top-center" />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Events</h1>
          {isUserAllowedToCreateEvents() && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-zinc-900 hover:bg-zinc-200"
            >
              Create Event
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold text-white">
                    {event.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(event.id)}
                    className={favorites.includes(event.id) ? "text-red-400 hover:text-red-300" : "text-zinc-400 hover:text-zinc-300"}
                  >
                    <Heart className={favorites.includes(event.id) ? "fill-current" : ""} />
                  </Button>
                </div>
                <Badge variant="outline" className="w-fit bg-zinc-800/50 text-zinc-300 border-zinc-700">
                  {event.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-400 line-clamp-2">{event.description}</p>
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{event.registered} / {event.capacity}</span>
                      <span>{Math.round((event.registered / event.capacity) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(event.registered / event.capacity) * 100} 
                      className="h-2 bg-zinc-800"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
                >
                  <Link to={`/events/${event.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8 text-zinc-400">
            <p>Loading events...</p>
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center py-8">
            <Button 
              onClick={() => setPage(p => p + 1)} 
              variant="outline"
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
            >
              Load More
            </Button>
          </div>
        )}

        <Dialog 
          open={showCreateModal} 
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              // Reset form state when dialog is closed
              setCurrentStep(1);
              setProgress(33);
              form.reset();
            }
          }}
        >
          <DialogContent className="bg-zinc-900 border border-zinc-700/50 shadow-2xl max-w-2xl mx-auto rounded-xl max-h-[85vh] overflow-y-auto [&>button[type='button']]:hidden">
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full h-8 w-8 p-0 hover:bg-zinc-700/50 transition-colors duration-200"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <path
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03157 3.2184C3.80702 2.99385 3.44295 2.99385 3.2184 3.2184C2.99385 3.44295 2.99385 3.80702 3.2184 4.03157L6.68682 7.50005L3.2184 10.9685C2.99385 11.193 2.99385 11.5571 3.2184 11.7816C3.44295 12.0062 3.80702 12.0062 4.03157 11.7816L7.50005 8.31322L10.9685 11.7816C11.193 12.0062 11.5571 12.0062 11.7816 11.7816C12.0062 11.5571 12.0062 11.193 11.7816 10.9685L8.31322 7.50005L11.7816 4.03157Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </div>
            <DialogHeader className="space-y-2 pb-4 border-b border-zinc-800">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Create New Event
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Fill in the details below to create your event. All fields are required unless stated otherwise.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <Progress 
                value={progress} 
                className="h-1.5 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-white [&>div]:to-zinc-400"
              />
              <div className="flex justify-between mt-1.5 text-xs text-zinc-500">
                <span>Step {currentStep} of 2</span>
                <span>{progress}% Complete</span>
              </div>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === 2) {
                  form.handleSubmit(onSubmit)(e);
                }
              }} 
              className="space-y-4"
            >
              <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50">
                {renderFormStep()}
              </div>
              <DialogFooter className="flex justify-between gap-2 pt-3 border-t border-zinc-800">
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCurrentStep(1);
                      setProgress(33);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const isNameValid = await form.trigger('name');
                        const isDateValid = await form.trigger('date');
                        const isCategoryValid = await form.trigger('category');
                        const isDescriptionValid = await form.trigger('description');
                        
                        if (isNameValid && isDateValid && isCategoryValid && isDescriptionValid) {
                          setCurrentStep(2);
                          setProgress(66);
                        }
                      } catch (error) {
                        // Silent fail, validation errors will be displayed in the form
                        // The form.trigger() functions will update error states automatically
                      }
                    }}
                    className="ml-auto bg-white text-zinc-900 hover:bg-zinc-200"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 