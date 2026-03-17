export async function runOpenAiChat(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  provider?: "openai" | "openrouter";
}) {
  const isRouter = opts.provider === "openrouter";
  const url = isRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${opts.apiKey}`,
  };

  if (isRouter) {
    headers["HTTP-Referer"] = "https://imani-os.example.com"; // Required for OpenRouter
    headers["X-Title"] = "Imani OS";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `AI request failed (${res.status})`);
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected AI response.");
  }
  return content.trim();
}