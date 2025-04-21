import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabaseClient'

// Define types
interface Event {
  id: string;
  name: string;
  description: string;
  [key: string]: any; // For other possible properties
}

interface FetchEventsResult {
  success: boolean;
  data: Event[];
  error?: Error;
}

// Service function to test
const fetchEvents = async (page = 1, itemsPerPage = 10): Promise<FetchEventsResult> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching events:', error)
    return { success: false, error: error as Error, data: [] }
  }
}

describe('fetchEvents Supabase Query', () => {
  const mockEvents: Event[] = [
    { id: '1', name: 'Event 1', description: 'Description 1' },
    { id: '2', name: 'Event 2', description: 'Description 2' }
  ]
  
  beforeEach(() => {
    vi.resetAllMocks()
  })
  
  it('returns events data when query is successful', async () => {
    // Setup mock
    const rangeMock = vi.fn().mockResolvedValue({ data: mockEvents, error: null })
    const selectMock = vi.fn().mockReturnValue({ range: rangeMock })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock })
    
    vi.spyOn(supabase, 'from').mockImplementation(fromMock as any)
    
    // Run test
    const result = await fetchEvents()
    
    // Assertions
    expect(fromMock).toHaveBeenCalledWith('events')
    expect(selectMock).toHaveBeenCalledWith('*')
    expect(rangeMock).toHaveBeenCalledWith(0, 9)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockEvents)
  })
  
  it('handles errors correctly', async () => {
    // Setup mock with error
    const testError = new Error('Database error')
    const rangeMock = vi.fn().mockResolvedValue({ data: null, error: testError })
    const selectMock = vi.fn().mockReturnValue({ range: rangeMock })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock })
    
    vi.spyOn(supabase, 'from').mockImplementation(fromMock as any)
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Run test
    const result = await fetchEvents()
    
    // Assertions
    expect(result.success).toBe(false)
    expect(result.data).toEqual([])
    expect(result.error).toBe(testError)
    expect(consoleErrorSpy).toHaveBeenCalled()
    
    // Cleanup
    consoleErrorSpy.mockRestore()
  })
  
  it('uses correct pagination values', async () => {
    // Setup mock
    const rangeMock = vi.fn().mockResolvedValue({ data: mockEvents, error: null })
    const selectMock = vi.fn().mockReturnValue({ range: rangeMock })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock })
    
    vi.spyOn(supabase, 'from').mockImplementation(fromMock as any)
    
    // Run test with custom pagination
    await fetchEvents(2, 20)
    
    // Assertions
    expect(rangeMock).toHaveBeenCalledWith(20, 39)
  })
})