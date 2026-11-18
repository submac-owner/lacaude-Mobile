/**
 * Wire adapters. One per protocol family.
 *
 * Each adapter: (a) builds the vendor request, (b) parses the vendor's SSE
 * stream, and (c) yields normalised `StreamEvent`s.
 */
import type { ChatMessage, ProviderConfig, StreamEvent } from './types';

type FetchLike = (input: any, init?: any) => Promise<any>;

function getFetch(): FetchLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo/fetch');
    if (mod && typeof mod.fetch === 'function') return mod.fetch;
  } catch {
    /* fall through */
  }
  return globalThis.fetch as unknown as FetchLike;
}

const trimSlash = (u: string) => u.replace(/\/+$/, '');

export function friendlyError(status: number, body: string, label: string): string {
  let detail = body;
  try {
    const j = JSON.parse(body);
    detail = j?.error?.message ?? j?.error?.status ?? j?.message ?? j?.detail ?? body;
    if (typeof detail !== 'string') detail = JSON.stringify(detail);
  } catch {
    /* keep raw */
  }
  if (status === 401) return `${label}: invalid API key.`;
  if (status === 403) return `${label}: key not permitted for this endpoint.`;
  if (status === 404) return `${label}: endpoint or model not found.`;
  if (status === 429) return `${label}: rate limited — retry shortly.`;
  if (status >= 500) return `${label}: upstream error (${status}).`;
  return detail ? `${label}: ${status} — ${detail.slice(0, 200)}` : `${label}: request failed (${status}).`;
}

/** Yields the `data:` payload strings from an SSE response body. */
async function* sseData(res: any): AsyncGenerator<string> {
  const reader = res.body?.getReader?.();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n');
      if (data) yield data;
    }
  }
  const tail = buffer.trim();
  if (tail.startsWith('data:')) yield tail.slice(5).trim();
}

function networkError(): StreamEvent {
  return { kind: 'error', message: 'Network error. Check your connection and retry.', retryable: true };
}

// ---------------------------------------------------------------------------
// Anthropic — /v1/messages
// ---------------------------------------------------------------------------
export async function* anthropicStream(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  opts: { system?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal },
): AsyncGenerator<StreamEvent> {
  const doFetch = getFetch();
  let res: any;
  try {
    res = await doFetch(`${trimSlash(cfg.baseUrl)}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        ...cfg.headers,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature,
        system: opts.system,
        messages,
        stream: true,
      }),
      signal: opts.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    yield networkError();
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    yield { kind: 'error', message: friendlyError(res.status, body, cfg.label), status: res.status, retryable: res.status === 429 || res.status >= 500 };
    return;
  }

  let stopReason: string | undefined;
  for await (const data of sseData(res)) {
    let p: any;
    try {
      p = JSON.parse(data);
    } catch {
      continue;
    }
    switch (p.type) {
      case 'message_start': {
        const u = p.message?.usage;
        if (u) yield { kind: 'usage', inputTokens: u.input_tokens, outputTokens: u.output_tokens };
        break;
      }
      case 'content_block_delta': {
        const d = p.delta;
        if (d?.type === 'text_delta' && d.text) yield { kind: 'text', text: d.text };
        else if (d?.type === 'thinking_delta' && d.thinking) yield { kind: 'thinking', text: d.thinking };
        break;
      }
      case 'message_delta': {
        stopReason = p.delta?.stop_reason ?? stopReason;
        if (p.usage) yield { kind: 'usage', outputTokens: p.usage.output_tokens };
        break;
      }
      case 'error':
        yield { kind: 'error', message: p.error?.message ?? 'Stream error.', retryable: true };
        return;
      case 'message_stop':
        yield { kind: 'stop', reason: stopReason };
        return;
      default:
        break;
    }
  }
  yield { kind: 'stop', reason: stopReason };
}

// ---------------------------------------------------------------------------
// OpenAI-compatible — /chat/completions
// ---------------------------------------------------------------------------
export async function* openaiStream(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  opts: { system?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal },
): AsyncGenerator<StreamEvent> {
  const doFetch = getFetch();
  const body: Record<string, unknown> = {
    model: cfg.model,
    stream: true,
    messages: [
      ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (typeof opts.temperature === 'number') body.temperature = opts.temperature;

  let res: any;
  try {
    res = await doFetch(`${trimSlash(cfg.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey.trim()}`,
        ...cfg.headers,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    yield networkError();
    return;
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    yield { kind: 'error', message: friendlyError(res.status, t, cfg.label), status: res.status, retryable: res.status === 429 || res.status >= 500 };
    return;
  }

  for await (const data of sseData(res)) {
    if (data === '[DONE]') {
      yield { kind: 'stop' };
      return;
    }
    let p: any;
    try {
      p = JSON.parse(data);
    } catch {
      continue;
    }
    if (p.usage) yield { kind: 'usage', inputTokens: p.usage.prompt_tokens, outputTokens: p.usage.completion_tokens };
    if (p.error) {
      yield { kind: 'error', message: p.error?.message ?? 'Stream error.', retryable: true };
      return;
    }
    const choice = p.choices?.[0];
    const d = choice?.delta;
    if (d?.content) yield { kind: 'text', text: d.content };
    if (d?.reasoning_content) yield { kind: 'thinking', text: d.reasoning_content };
    if (d?.reasoning) yield { kind: 'thinking', text: d.reasoning };
    if (choice?.finish_reason) {
      yield { kind: 'stop', reason: choice.finish_reason };
      return;
    }
  }
  yield { kind: 'stop' };
}

// ---------------------------------------------------------------------------
// Google Gemini — :streamGenerateContent?alt=sse
// ---------------------------------------------------------------------------
export async function* googleStream(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  opts: { system?: string; maxTokens?: number; temperature?: number; signal?: AbortSignal },
): AsyncGenerator<StreamEvent> {
  const doFetch = getFetch();
  const url = `${trimSlash(cfg.baseUrl)}/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`;
  const generationConfig: Record<string, unknown> = {};
  if (opts.maxTokens) generationConfig.maxOutputTokens = opts.maxTokens;
  if (typeof opts.temperature === 'number') generationConfig.temperature = opts.temperature;

  let res: any;
  try {
    res = await doFetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': cfg.apiKey.trim(),
        ...cfg.headers,
      },
      body: JSON.stringify({
        ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
      }),
      signal: opts.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    yield networkError();
    return;
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    yield { kind: 'error', message: friendlyError(res.status, t, cfg.label), status: res.status, retryable: res.status === 429 || res.status >= 500 };
    return;
  }

  for await (const data of sseData(res)) {
    let p: any;
    try {
      p = JSON.parse(data);
    } catch {
      continue;
    }
    if (p.error) {
      yield { kind: 'error', message: p.error?.message ?? 'Stream error.', retryable: true };
      return;
    }
    const um = p.usageMetadata;
    if (um) yield { kind: 'usage', inputTokens: um.promptTokenCount, outputTokens: um.candidatesTokenCount };
    const cand = p.candidates?.[0];
    for (const part of cand?.content?.parts ?? []) {
      if (typeof part.text === 'string' && part.text) yield { kind: 'text', text: part.text };
    }
    if (cand?.finishReason && cand.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
      yield { kind: 'stop', reason: cand.finishReason };
      return;
    }
  }
  yield { kind: 'stop' };
}
