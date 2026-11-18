/**
 * Provider-agnostic chat types.
 *
 * A provider is described by a *kind* (wire protocol) plus a base URL. The
 * adapters translate one common shape into each vendor's request format and
 * normalise the vendor's streaming events back into `StreamEvent`.
 */

export type Role = 'user' | 'assistant';

/** Wire protocol family. */
export type ProviderKind = 'anthropic' | 'openai' | 'google';

export type PresetModel = { id: string; label: string };

export type ProviderPreset = {
  id: string;
  label: string;
  kind: ProviderKind;
  /** Base URL including any version path, e.g. https://api.openai.com/v1 */
  baseUrl: string;
  keyPlaceholder: string;
  docsUrl?: string;
  models: PresetModel[];
  /** True when the preset has no default endpoint and the user must supply one. */
  needsBaseUrl?: boolean;
  note?: string;
};

/** Resolved, user-selected configuration for one provider. */
export type ProviderConfig = {
  providerId: string;
  kind: ProviderKind;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  headers?: Record<string, string>;
};

export type ChatMessage = { role: Role; content: string };

export type StreamEvent =
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'usage'; inputTokens?: number; outputTokens?: number }
  | { kind: 'stop'; reason?: string }
  | { kind: 'error'; message: string; status?: number; retryable?: boolean };

export type ChatRequest = {
  config: ProviderConfig;
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
};
