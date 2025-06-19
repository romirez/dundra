import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('LivePlay ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-300">
                Live Play Error
              </h3>
            </div>
          </div>
          <div className="text-sm text-red-200 mb-4">
            <p className="mb-2">
              An error occurred in the Live Play interface. This is usually temporary.
            </p>
            {this.state.error && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium text-red-300">Error details</summary>
                <pre className="mt-2 text-xs bg-red-900/30 p-2 rounded overflow-auto text-red-200">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={this.handleReset}
              className="btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}