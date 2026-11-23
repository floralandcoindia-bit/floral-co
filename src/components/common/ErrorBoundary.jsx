import { Component } from "react";

/** Last-resort fallback so a rendering error shows a message instead of a blank screen. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-forest px-6 text-center text-ivory">
        <div>
          <h1 className="font-serif text-5xl">Something went wrong.</h1>
          <p className="mx-auto mt-4 max-w-sm text-mist">Please reload the page. If it keeps happening, message us on WhatsApp.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 h-12 rounded-full bg-ivory px-8 text-sm font-medium text-forest"
          >
            Reload
          </button>
        </div>
      </main>
    );
  }
}
