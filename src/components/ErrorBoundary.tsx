import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }
  
  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={this.handleReset}
                className="bg-white text-black hover:bg-gray-200"
              >
                Try again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary