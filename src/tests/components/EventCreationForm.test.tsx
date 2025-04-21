import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Simplified test component
function EventCreationForm({ onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      capacity: parseInt(formData.get('capacity')),
      category: formData.get('category'),
      isFeatured: formData.get('isFeatured') === 'on'
    }
    onSubmit(data)
  }
  
  return (
    <div>
      <h2 data-testid="form-title">Create New Event</h2>
      <form onSubmit={handleSubmit} data-testid="event-form">
        <div>
          <label htmlFor="name">Event Name</label>
          <input
            id="name"
            name="name"
            data-testid="name-input"
          />
        </div>
        
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            data-testid="description-input"
          />
        </div>
        
        <div>
          <label htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            defaultValue="10"
            data-testid="capacity-input"
          />
        </div>
        
        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            defaultValue="workshop"
            data-testid="category-select"
          >
            <option value="workshop">Workshop</option>
            <option value="conference">Conference</option>
            <option value="meetup">Meetup</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            data-testid="featured-checkbox"
          />
          <label htmlFor="isFeatured">Feature this event</label>
        </div>
        
        <div>
          <button type="submit" data-testid="submit-button">Create Event</button>
          <button type="button" onClick={onCancel} data-testid="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  )
}

// Tests
describe('EventCreationForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })
  
  it('renders form fields correctly', () => {
    render(
      <EventCreationForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    )
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Create New Event')
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('description-input')).toBeInTheDocument()
    expect(screen.getByTestId('capacity-input')).toBeInTheDocument()
    expect(screen.getByTestId('category-select')).toBeInTheDocument()
    expect(screen.getByTestId('featured-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
  })
  
  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <EventCreationForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    )
    
    const cancelButton = screen.getByTestId('cancel-button')
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })
  
  it('submits the form with correct values', async () => {
    const user = userEvent.setup()
    
    render(
      <EventCreationForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Fill in form fields
    await user.type(screen.getByTestId('name-input'), 'New Test Event')
    await user.type(screen.getByTestId('description-input'), 'This is a test event description')
    await user.clear(screen.getByTestId('capacity-input'))
    await user.type(screen.getByTestId('capacity-input'), '50')
    await user.selectOptions(screen.getByTestId('category-select'), 'conference')
    await user.click(screen.getByTestId('featured-checkbox'))
    
    // Submit the form
    await user.click(screen.getByTestId('submit-button'))
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'New Test Event',
      description: 'This is a test event description',
      capacity: 50,
      category: 'conference',
      isFeatured: true
    })
  })
})