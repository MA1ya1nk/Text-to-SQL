import logging
import os
import random
import time

from openai import OpenAI


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
        self.logger = logging.getLogger(__name__)
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")
        self.openai = OpenAI(api_key=self.openai_key) if self.openai_key else None
        self.mistral = (
            OpenAI(api_key=self.mistral_key, base_url="https://api.mistral.ai/v1")
            if self.mistral_key
            else None
        )

    def _extract_status_code(self, exc: Exception) -> int | None:
        for attr in ("status_code", "code"):
            value = getattr(exc, attr, None)
            if isinstance(value, int):
                return value
            if isinstance(value, str) and value.isdigit():
                return int(value)

        response = getattr(exc, "response", None)
        if response is not None:
            response_status = getattr(response, "status_code", None)
            if isinstance(response_status, int):
                return response_status

        return None

    def _map_exception(self, exc: Exception, provider: str) -> LLMServiceError:
        status_code = self._extract_status_code(exc)
        message = str(exc).lower()
        self.logger.warning(
            "llm_call_failed provider=%s status_code=%s error_type=%s message=%s",
            provider,
            status_code,
            type(exc).__name__,
            str(exc),
        )

        if status_code == 401 or any(
            token in message
            for token in ["api key", "authentication", "permission denied", "unauthorized", "forbidden"]
        ):
            return LLMAuthError()

        if status_code == 429 or any(
            token in message for token in ["rate limit", "quota exceeded", "resource exhausted", "too many requests"]
        ):
            return LLMRateLimitError()

        if (status_code is not None and status_code >= 500) or any(
            token in message for token in ["timeout", "temporarily unavailable", "service unavailable", "connection error"]
        ):
            return LLMProviderUnavailableError()

        return LLMServiceError("AI processing failed for this request. Please try again.")

    def _complete_with_retries(self, provider: str, request_fn) -> str:
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                return request_fn()
            except Exception as exc:
                mapped_error = self._map_exception(exc, provider=provider)
                is_retryable = (
                    isinstance(mapped_error, (LLMRateLimitError, LLMProviderUnavailableError))
                    and attempt < max_attempts
                )
                if not is_retryable:
                    raise mapped_error from exc

                backoff_seconds = (0.8 * (2 ** (attempt - 1))) + random.uniform(0, 0.25)
                self.logger.info(
                    "llm_retry provider=%s attempt=%s backoff_seconds=%.2f",
                    provider,
                    attempt,
                    backoff_seconds,
                )
                time.sleep(backoff_seconds)

        raise LLMServiceError("AI processing failed for this request. Please try again.")

    def complete(self, prompt: str, system: str = "You are a helpful assistant.") -> str:
        try:
            if self.openai:
                return self._complete_with_retries(
                    provider="openai",
                    request_fn=lambda: (
                        self.openai.chat.completions.create(
                            model="gpt-4o-mini",
                            messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                            temperature=0.1,
                        ).choices[0].message.content
                        or ""
                    ),
                )
            if self.mistral:
                return self._complete_with_retries(
                    provider="mistral",
                    request_fn=lambda: (
                        self.mistral.chat.completions.create(
                            model="mistral-small-latest",
                            messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                            temperature=0.1,
                        ).choices[0].message.content
                        or ""
                    ),
                )
            raise LLMAuthError("No LLM provider configured. Set OPENAI_API_KEY or MISTRAL_API_KEY.")
        except LLMServiceError:
            raise
        except Exception as exc:
            raise self._map_exception(exc, provider="unknown") from exc


llm_client = LLMClient()
