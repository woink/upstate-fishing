import { Component, type ComponentChildren } from 'preact';

interface ErrorBoundaryProps {
  /** Content to render when no error */
  children: ComponentChildren;
  /** Optional custom fallback UI */
  fallback?: ComponentChildren;
  /** Name of the component being wrapped (for error messages) */
  name?: string;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the whole page.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary name="TopPicks">
 *   <TopPicks apiUrl={apiUrl} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error(`Error in ${this.props.name ?? 'component'}:`, error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div class='bg-red-50 border border-red-200 rounded-lg p-6'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>⚠️</span>
            <div class='flex-1'>
              <h3 class='font-semibold text-red-800'>
                {this.props.name ? `${this.props.name} failed to load` : 'Something went wrong'}
              </h3>
              <p class='text-red-700 text-sm mt-1'>
                {this.state.error?.message ?? 'An unexpected error occurred'}
              </p>
              <div class='mt-4 flex gap-2'>
                <button
                  type='button'
                  onClick={this.handleRetry}
                  class='px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition'
                >
                  Try Again
                </button>
                <button
                  type='button'
                  onClick={() => globalThis.location.reload()}
                  class='px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition'
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error message for use within components
 */
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div class='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
      <p class='text-red-700'>{message}</p>
      {onRetry && (
        <button
          type='button'
          onClick={onRetry}
          class='mt-2 text-red-600 underline text-sm'
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
