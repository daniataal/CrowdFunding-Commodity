"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export class ClientErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ClientErrorBoundary caught:", error, info)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="rounded-lg border border-border bg-card/50 p-6">
        <div className="text-lg font-semibold">{this.props.title ?? "Something went wrong"}</div>
        <div className="mt-2 text-sm text-muted-foreground">
          A client-side error occurred while rendering this view.
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={this.reset} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Try again
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
          {String(this.state.error?.message ?? this.state.error)}
        </pre>
      </div>
    )
  }
}


