'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle, Button } from 'ui'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for monitoring and debugging
    console.error('[Layout ErrorBoundary] Unhandled error rendering children:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 my-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              <p>An unexpected error occurred while loading this page layout content.</p>
              {this.state.error?.message && (
                <p className="mt-2 font-mono text-xs opacity-90">{this.state.error.message}</p>
              )}
              <div className="mt-4">
                <Button
                  type="default"
                  size="tiny"
                  onClick={this.handleReset}
                  icon={<RefreshCw size={14} />}
                >
                  Try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
