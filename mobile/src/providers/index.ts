/**
 * Provider registry: dispatch to the right wire adapter, plus a lightweight
 * connectivity check that works for every provider kind.
 */
import { anthropicStream, googleStream, openaiStream } from './adapters';
import type { ChatRequest, ProviderConfig, StreamEvent } from './types';

export * from './types';
export { PRESETS, presetById } from './presets';

export function streamChat(req: ChatRequest): AsyncGenerator<StreamEvent> {
  const { config } = req;
  switch (config.kind) {
    case 'anthropic':
      return anthropicStream(config, req.messages, req);
    case 'google':
      return googleStream(config, req.messages, req);
    case 'openai':
    default:
      return openaiStream(config, req.messages, req);
  }
}

/** Returns a human message when the config is not yet usable, else null. */
export function configProblem(cfg: ProviderConfig): string | null {
  if (!cfg.apiKey.trim()) return 'Add an API key for this provider.';
  if (!cfg.baseUrl.trim()) return 'This provider needs a base URL.';
  if (!cfg.model.trim()) return 'Choose or type a model id.';
  if (!/^https?:\/\//i.test(cfg.baseUrl.trim())) return 'Base URL must start with http:// or https://';
  return null;
}

export async function verifyProvider(cfg: ProviderConfig): Promise<{ ok: boolean; message: string }> {
  const problem = configProblem(cfg);
  if (problem) return { ok: false, message: problem };
  const iterator = streamChat({
    config: cfg,
    messages: [{ role: 'user', content: 'ping' }],
    maxTokens: 1,
  });
  try {
    const first = await iterator.next();
    if (first.done) return { ok: false, message: 'No response from endpoint.' };
    const ev = first.value;
    if (ev.kind === 'error') return { ok: false, message: ev.message };
    return { ok: true, message: 'Connection OK.' };
  } catch (e: any) {
    return { ok: false, message: e?.message ? String(e.message) : 'Request failed.' };
  }
}
