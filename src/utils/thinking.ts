export function splitThinking(content: string): { visible: string; thinking: string } {
  if (!content) return { visible: '', thinking: '' };
  let thinkingParts: string[] = [];
  // Extract <think>...</think>
  const thinkTag = /<think>([\s\S]*?)<\/think>/gi;
  content = content.replace(thinkTag, (_, inner: string) => {
    thinkingParts.push(inner.trim());
    return '';
  });
  // Extract <thinking>...</thinking>
  const thinkingTag = /<thinking>([\s\S]*?)<\/thinking>/gi;
  content = content.replace(thinkingTag, (_, inner: string) => {
    thinkingParts.push(inner.trim());
    return '';
  });
  // Extract <analysis>...</analysis>
  const analysisTag = /<analysis>([\s\S]*?)<\/analysis>/gi;
  content = content.replace(analysisTag, (_, inner: string) => {
    thinkingParts.push(inner.trim());
    return '';
  });
  // Extract <|thinking|>...</|thinking|>
  const pipeThinking = /<\|thinking\|>([\s\S]*?)<\|\/thinking\|>/gi;
  content = content.replace(pipeThinking, (_, inner: string) => {
    thinkingParts.push(inner.trim());
    return '';
  });
  // Extract fenced ```thinking
  const fence = /```(?:thinking|thoughts|think)\s*\n([\s\S]*?)```/gi;
  content = content.replace(fence, (_, inner: string) => {
    thinkingParts.push(inner.trim());
    return '';
  });
  const visible = content.trim();
  const thinking = thinkingParts.join('\n\n').trim();
  return { visible, thinking };
}


