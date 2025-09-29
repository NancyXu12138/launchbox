import { getSettings } from './settings';

export type OllamaChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function* streamOllamaChat(messages: OllamaChatMessage[]): AsyncGenerator<string> {
  const { baseUrl, model } = getSettings();
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });
  if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data?.message?.content) {
            yield String(data.message.content);
          }
        } catch {
          // ignore non-JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}


