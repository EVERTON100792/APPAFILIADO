import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-3xl bg-accent/20 rounded-full" />
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-accent/30 flex items-center justify-center relative shadow-2xl">
              <AlertTriangle size={48} className="text-accent animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-4 italic">
            OPS! <span className="text-accent">SISTEMA REINICIANDO</span>
          </h1>
          
          <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-12">
            Detectamos uma instabilidade temporária no Motor Viral. Não se preocupe, seus dados estão seguros.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCcw size={16} /> RECARREGAR APP
            </button>
            
            <button
              onClick={this.handleGoHome}
              className="w-full py-4 bg-slate-900 text-slate-400 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <Home size={16} /> VOLTAR PARA HOME
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-12 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-2xl text-left overflow-auto">
              <p className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                {this.state.error?.stack}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
