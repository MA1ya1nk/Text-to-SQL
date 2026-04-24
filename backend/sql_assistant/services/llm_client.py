import os

from openai import OpenAI

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


class LLMServiceError(RuntimeError):
    status_code = 500
    code = "llm_error"

    def __init__(self, message: str | None = None):
        super().__init__(message or "LLM service failed.")
        self.user_message = message or "We could not process your request right now. Please try again."


class LLMRateLimitError(LLMServiceError):
    status_code = 429
    code = "rate_limit"

    def __init__(self, message: str | None = None):
        super().__init__(
            message
            or "We are currently experiencing high traffic. Please try again in a few moments."
        )


class LLMAuthError(LLMServiceError):
    status_code = 401
    code = "provider_auth"

    def __init__(self, message: str | None = None):
        super().__init__(message or "LLM provider authentication failed. Please verify API keys.")


class LLMProviderUnavailableError(LLMServiceError):
    status_code = 503
    code = "provider_unavailable"

    def __init__(self, message: str | None = None):
        super().__init__(message or "The AI provider is temporarily unavailable. Please try again shortly.")


class LLMClient:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai = OpenAI(api_key=self.openai_key) if self.openai_key else None
        if self.gemini_key and genai:
            genai.configure(api_key=self.gemini_key)

    def complete(self, prompt: str, system: str = "You are a helpful assistant.") -> str:
        try:
            if self.openai:
                response = self.openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                    temperature=0.1,
                )
                return response.choices[0].message.content or ""
            if self.gemini_key and genai:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(f"{system}\n\n{prompt}")
                return response.text or ""
            raise LLMAuthError("No LLM provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.")
        except LLMServiceError:
            raise
        except Exception as exc:
            message = str(exc).lower()
            if any(token in message for token in ["429", "rate limit", "quota exceeded", "resource exhausted", "too many requests"]):
                raise LLMRateLimitError() from exc
            if any(token in message for token in ["api key", "authentication", "permission denied", "unauthorized", "forbidden"]):
                raise LLMAuthError() from exc
            if any(token in message for token in ["timeout", "temporarily unavailable", "service unavailable", "connection error"]):
                raise LLMProviderUnavailableError() from exc
            raise LLMServiceError("AI processing failed for this request. Please try again.") from exc


llm_client = LLMClient()
