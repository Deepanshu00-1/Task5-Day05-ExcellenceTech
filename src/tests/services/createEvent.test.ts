import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Define types
interface EventData {
  name: string;
  description: string;
  category: string;
  date: string;
  capacity: number;
  is_featured: boolean;
}

interface CreateEventResult {
  success: boolean;
  data?: any;
  error?: Error;
}

// Service function to test
const createEvent = async (eventData: EventData): Promise<CreateEventResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        organizer_id: user.id,
        registered: 0
      })
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating event:', error)
    return { success: false, error: error as Error }
  }
}

describe('createEvent Supabase Query', () => {
  // Define mock user with proper structure to match the Supabase User type
  const mockUser: Partial<User> = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    confirmed_at: '2023-01-01T00:00:00Z',
    email: 'test@example.com',
    phone: '',
    role: '',
    updated_at: '2023-01-01T00:00:00Z',
    identities: [],
    factors: []
  }
  
  const mockEventData: EventData = {
    name: 'New Event',
    description: 'Event description',
    category: 'workshop',
    date: '2023-12-31T12:00:00Z',
    capacity: 50,
    is_featured: false
  }
  
  const mockCreatedEvent = {
    id: 'event-123',
    ...mockEventData,
    organizer_id: mockUser.id,
    registered: 0
  }
  
  beforeEach(() => {
    vi.resetAllMocks()
  })
  
  it('creates an event successfully when user is authenticated', async () => {
    // Mock auth.getUser
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: mockUser as User },
      error: null
    })
    
    // Mock database insert
    const singleMock = vi.fn().mockResolvedValue({
      data: mockCreatedEvent,
      error: null
    })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock })
    
    vi.spyOn(supabase, 'from').mockImplementation(fromMock as any)
    
    // Run test
    const result = await createEvent(mockEventData)
    
    // Assertions
    expect(supabase.auth.getUser).toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalledWith('events')
    expect(insertMock).toHaveBeenCalledWith({
      ...mockEventData,
      organizer_id: mockUser.id,
      registered: 0
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockCreatedEvent)
  })
  
  it('returns error when user is not authenticated', async () => {
    // Mock auth.getUser to return no user
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null
    } as any)
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Run test
    const result = await createEvent(mockEventData)
    
    // Assertions
    expect(result.success).toBe(false)
    if (result.error) {
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error.message).toBe('User not authenticated')
    } else {
      expect.fail('Expected result.error to be defined')
    }
    
    // Cleanup
    consoleErrorSpy.mockRestore()
  })
  
  it('handles database errors', async () => {
    // Mock auth.getUser
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: mockUser as User },
      error: null
    })
    
    // Mock database error
    const testError = new Error('Insert failed')
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: testError
    })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    const fromMock = vi.fn().mockReturnValue({ insert: insertMock })
    
    vi.spyOn(supabase, 'from').mockImplementation(fromMock as any)
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Run test
    const result = await createEvent(mockEventData)
    
    // Assertions
    expect(result.success).toBe(false)
    expect(result.error).toBe(testError)
    expect(consoleErrorSpy).toHaveBeenCalled()
    
    // Cleanup
    consoleErrorSpy.mockRestore()
  })
})