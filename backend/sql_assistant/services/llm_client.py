import os

from openai import OpenAI

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


class LLMClient:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai = OpenAI(api_key=self.openai_key) if self.openai_key else None
        if self.gemini_key and genai:
            genai.configure(api_key=self.gemini_key)

    def complete(self, prompt: str, system: str = "You are a helpful assistant.") -> str:
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
        raise RuntimeError("No LLM provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.")


llm_client = LLMClient()
