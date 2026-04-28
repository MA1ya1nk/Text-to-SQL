"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="error-callout">
        <p className="error-title">Something unexpected happened</p>
        <p className="error-detail">
          We could not complete this action due to an unexpected issue. Please retry, and if this continues, refresh the page.
        </p>
        <button onClick={reset} className="primary-btn mt-3">
          Try again
        </button>
      </div>
    </div>
  );
}
