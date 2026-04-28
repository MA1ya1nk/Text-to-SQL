import { ApiError } from "./api";

export type UIError = {
  code: string;
  message: string;
  title: string;
  canRetry: boolean;
};

export function normalizeError(error: unknown): UIError {
  const apiError = error as ApiError | undefined;
  const code = apiError?.code || "";
  const status = apiError?.status;
  const fallbackMessage = "Something went wrong while processing your request. Please try again.";
  const message = apiError?.message || fallbackMessage;
  const lowered = message.toLowerCase();

  if (code === "schema_out_of_scope" || lowered.includes("cannot be answered from the current schema")) {
    return {
      code: "schema_out_of_scope",
      title: "Schema mismatch",
      message:
        "This question is outside the connected schema. Use available tables/columns from Schema Explorer or rephrase your request.",
      canRetry: true
    };
  }
  if (code === "rate_limit") {
    return {
      code,
      title: "Service is busy",
      message: "We are experiencing high traffic. Please wait a moment and try again.",
      canRetry: true
    };
  }
  if (code === "provider_auth") {
    return {
      code,
      title: "Configuration issue",
      message: "AI provider authentication failed. Please verify API keys in backend configuration.",
      canRetry: false
    };
  }
  if (code === "provider_unavailable") {
    return {
      code,
      title: "Provider unavailable",
      message: "The AI provider is temporarily unavailable. Please retry shortly.",
      canRetry: true
    };
  }
  if (code === "network_error") {
    return {
      code,
      title: "Connection problem",
      message: "Could not reach the server. Check your network or backend status and retry.",
      canRetry: true
    };
  }
  if (code === "request_timeout") {
    return {
      code,
      title: "Request timed out",
      message: "The request took too long. Please try again.",
      canRetry: true
    };
  }
  if (status === 404) {
    return {
      code: code || "not_found",
      title: "Not found",
      message: "The requested resource was not found.",
      canRetry: false
    };
  }

  return {
    code: code || "unknown_error",
    title: "Request could not be completed",
    message,
    canRetry: true
  };
}
