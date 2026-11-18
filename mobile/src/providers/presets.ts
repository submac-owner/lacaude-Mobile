import type { ProviderPreset } from './types';

/**
 * Provider presets.
 *
 * `models` lists are convenience defaults only — every provider also accepts a
 * free-typed model id, so a stale list never blocks you.
 *
 * Presets whose endpoint is not publicly fixed (tokenharbor, agnes, custom)
 * ship with an empty `baseUrl` and `needsBaseUrl: true`; supply the endpoint in
 * Settings. We deliberately do not guess those URLs.
 */
export const PRESETS: ProviderPreset[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://docs.anthropic.com/en/api/messages',
    models: [
      { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
      { id: 'claude-opus-4-1', label: 'Claude Opus 4.1' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    ],
  },
  {
    id: 'google',
    label: 'Google Gemini',
    kind: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://ai.google.dev/api/generate-content',
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/docs',
    models: [
      { id: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5 (via OpenRouter)' },
      { id: 'openai/gpt-4o', label: 'GPT-4o (via OpenRouter)' },
      { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (via OpenRouter)' },
    ],
  },
  {
    id: 'tokenharbor',
    label: 'TokenHarbor',
    kind: 'openai',
    baseUrl: '',
    needsBaseUrl: true,
    keyPlaceholder: 'API key',
    note: 'OpenAI-compatible gateway. Set the base URL and model id from your TokenHarbor dashboard.',
    models: [],
  },
  {
    id: 'agnes',
    label: 'Agnes AI',
    kind: 'openai',
    baseUrl: '',
    needsBaseUrl: true,
    keyPlaceholder: 'API key',
    note: 'Set the base URL and model id from your Agnes AI account.',
    models: [],
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    kind: 'openai',
    baseUrl: '',
    needsBaseUrl: true,
    keyPlaceholder: 'API key',
    note: 'Any OpenAI-compatible /chat/completions endpoint (vLLM, Ollama, LM Studio, LiteLLM, ...).',
    models: [],
  },
];

export function presetById(id: string): ProviderPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
