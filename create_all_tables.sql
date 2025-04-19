-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.event_questions CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.event_comments CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  is_organizer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 300),
  category VARCHAR(50) NOT NULL CHECK (category IN ('workshop', 'conference', 'meetup', 'other')),
  date TIMESTAMP WITH TIME ZONE NOT NULL CHECK (date > NOW()),
  location TEXT DEFAULT '',
  capacity INTEGER NOT NULL CHECK (capacity >= 10 AND capacity <= 1000),
  registered INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the event_questions table
CREATE TABLE public.event_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create the registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create the event_comments table
CREATE TABLE public.event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_event ON public.favorites(event_id);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_comments_event ON public.event_comments(event_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at before update
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY "Events are viewable by everyone."
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create events."
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_organizer = TRUE
    )
  );

CREATE POLICY "Organizers can update their own events."
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events."
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Create policies for event_questions
CREATE POLICY "Event questions are viewable by everyone."
  ON public.event_questions FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create event questions."
  ON public.event_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.profiles p ON e.organizer_id = p.user_id
      WHERE e.id = event_id AND p.user_id = auth.uid() AND p.is_organizer = TRUE
    )
  );

CREATE POLICY "Organizers can update their event questions."
  ON public.event_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete their event questions."
  ON public.event_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites."
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites."
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites."
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for registrations
CREATE POLICY "Organizers can view their event registrations."
  ON public.registrations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT e.organizer_id FROM public.events e WHERE e.id = event_id
    )
    OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can register for events."
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only cancel their own registrations."
  ON public.registrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for event_comments
CREATE POLICY "Comments are viewable by everyone."
  ON public.event_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can add comments."
  ON public.event_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments."
  ON public.event_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to check event capacity before insert or update
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT registered FROM public.events WHERE id = NEW.event_id) >= 
     (SELECT capacity FROM public.events WHERE id = NEW.event_id) THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;
  
  -- Increment registered count
  UPDATE public.events SET registered = registered + 1 WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check capacity before registrations
CREATE TRIGGER check_capacity_before_registration
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION check_event_capacity();

-- Create function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant usage privileges to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.event_questions TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.registrations TO authenticated;
GRANT ALL ON public.event_comments TO authenticated;

-- For sequences created by the tables
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 