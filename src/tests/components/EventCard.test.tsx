import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Define types for the event and component props
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

interface EventCardProps {
  event: Event;
  isFavorited: boolean;
  onToggleFavorite: (eventId: string) => void;
}

// Create a simplified test component based on your Events.tsx rendering logic
const EventCard = ({ event, isFavorited, onToggleFavorite }: EventCardProps) => (
  <div className="event-card" data-testid="event-card">
    <h3 data-testid="event-title">{event.name}</h3>
    <p data-testid="event-description">{event.description}</p>
    <div data-testid="event-category">{event.category}</div>
    <div data-testid="event-location">{event.location}</div>
    <div data-testid="registration-count">
      {event.registered} / {event.capacity}
    </div>
    <button 
      data-testid="favorite-button"
      className={isFavorited ? "favorited" : ""}
      onClick={() => onToggleFavorite(event.id)}
    >
      Favorite
    </button>
    <a href={`/events/${event.id}`} data-testid="view-details-link">
      View Details
    </a>
  </div>
)

describe('EventCard Component', () => {
  const mockEvent: Event = {
    id: '1',
    name: 'Test Event',
    description: 'This is a test event description',
    category: 'workshop',
    date: '2023-12-25T12:00:00Z',
    location: 'Test Location',
    capacity: 100,
    registered: 50
  }
  
  const mockToggleFavorite = vi.fn()
  
  it('renders event information correctly', () => {
    render(
      <BrowserRouter>
        <EventCard 
          event={mockEvent} 
          isFavorited={false}
          onToggleFavorite={mockToggleFavorite} 
        />
      </BrowserRouter>
    )
    
    expect(screen.getByTestId('event-title')).toHaveTextContent('Test Event')
    expect(screen.getByTestId('event-description')).toHaveTextContent('This is a test event description')
    expect(screen.getByTestId('event-category')).toHaveTextContent('workshop')
    expect(screen.getByTestId('event-location')).toHaveTextContent('Test Location')
    expect(screen.getByTestId('registration-count')).toHaveTextContent('50 / 100')
  })
  
  it('calls toggle favorite function when favorite button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <EventCard 
          event={mockEvent} 
          isFavorited={false}
          onToggleFavorite={mockToggleFavorite} 
        />
      </BrowserRouter>
    )
    
    const favoriteButton = screen.getByTestId('favorite-button')
    await user.click(favoriteButton)
    
    expect(mockToggleFavorite).toHaveBeenCalledWith('1')
  })
  
  it('displays the correct style when event is favorited', () => {
    render(
      <BrowserRouter>
        <EventCard 
          event={mockEvent} 
          isFavorited={true}
          onToggleFavorite={mockToggleFavorite} 
        />
      </BrowserRouter>
    )
    
    const favoriteButton = screen.getByTestId('favorite-button')
    expect(favoriteButton).toHaveClass('favorited')
  })
})