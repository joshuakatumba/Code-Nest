import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="courses-container" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '12px', color: '#252641' }}>Something went wrong</h2>
          <p style={{ marginBottom: '20px', color: '#696984' }}>{this.state.errorMessage}</p>
          <button
            type="button"
            className="btn-enroll"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              window.location.href = '/';
            }}
          >
            Return to Home
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

