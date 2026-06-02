import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // In a production app, you might log this to Sentry or Datadog here
    console.error("Uncaught Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-xl w-full glass-card p-8 rounded-3xl border border-red-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-red-500/10 blur-[50px] pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="h-20 w-20 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-inner">
                <AlertTriangle className="h-10 w-10" />
              </div>
              
              <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-3">
                Fatal Application Exception
              </h1>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-md">
                A severe runtime error has occurred, forcing the UI to halt to prevent data corruption. Our engineering team has been notified.
              </p>
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 w-full text-left mb-8 overflow-auto max-h-48 text-xs font-mono text-slate-300">
                <p className="text-red-400 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                <p className="opacity-70 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="bg-amazon-orange hover:bg-amber-500 text-slate-950 text-sm font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <RefreshCcw className="h-4 w-4" />
                Reboot Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
