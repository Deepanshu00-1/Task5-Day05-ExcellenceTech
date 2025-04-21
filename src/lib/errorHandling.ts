import { toast } from 'sonner'

export type ApiError = {
  message: string
  code?: string
  status?: number
}

// Generic error handler
export const handleApiError = (error: ApiError | Error | unknown, fallbackMessage = 'An unexpected error occurred'): void => {
  let errorMessage = fallbackMessage
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = error.message as string
  }
  
  // Log error for debugging
  console.error('API Error:', error)
  
  // Display user-friendly toast
  toast.error(errorMessage)
}

// Specific error handlers for common scenarios
export const handleRegistrationErrors = (error: any): void => {
  // Handle duplicate registration
  if (error?.code === '23505') {
    toast.error('You are already registered for this event')
    return
  }
  
  // Handle capacity full error
  if (error?.message?.includes('capacity') || error?.message?.includes('full')) {
    toast.error('This event is now full. Please try another event')
    return
  }
  
  // Default error handling
  handleApiError(error, 'Unable to complete registration')
}

// Helper function to check if event is full
export const isEventFull = (event: { registered: number, capacity: number }): boolean => {
  return event.registered >= event.capacity
}