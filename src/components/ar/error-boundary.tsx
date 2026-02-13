"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ARErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] p-6 text-center">
          <h2 className="text-xl font-bold text-red-400">AR エラー</h2>
          <p className="text-sm text-[#94a3b8]">{this.state.error.message}</p>
          <pre className="max-w-full overflow-auto rounded bg-[#1e293b] p-3 text-left text-xs text-[#f1f5f9]">
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.href = "/";
            }}
            className="rounded-lg bg-[#3b82f6] px-6 py-2 text-white"
          >
            トップに戻る
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
