import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Waves, RefreshCw, AlertTriangle } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DS AQUATICS ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md text-white flex items-center-safe justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Waves className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-heading">
                DS AQUATICS
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                Memuat Ulang Tampilan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Terjadi sedikit kendala saat sinkronisasi data klub. Silakan klik tombol di bawah untuk memuat ulang dengan aman.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl font-heading font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  try {
                    window.location.href = '/';
                  } catch {}
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 cursor-pointer transition-all"
              >
                Kembali ke Beranda Website
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
