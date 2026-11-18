/**
 * Local persistence: per-provider API keys (secure) + conversations + settings.
 * Nothing leaves the device except the chat request you configure.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ChatMessage } from '../providers/types';
import { PRESETS, presetById } from '../providers/presets';

const K_KEYS = 'lacaude.keys.v1';
const K_CONVS = 'lacaude.conversations.v1';
const K_SETTINGS = 'lacaude.settings.v1';

// ---------------------------------------------------------------------------
// Secure storage — expo-secure-store on native, localStorage on web.
// ---------------------------------------------------------------------------
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  SecureStore = null;
}

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore?.getItemAsync) {
      return (await SecureStore.getItemAsync(key)) ?? null;
    }
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return null;
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore?.setItemAsync) {
      if (value) await SecureStore.setItemAsync(key, value);
      else await SecureStore.deleteItemAsync(key);
      return;
    }
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Per-provider API keys
// ---------------------------------------------------------------------------
export type KeyMap = Record<string, string>;

export async function getKeys(): Promise<KeyMap> {
  const raw = await secureGet(K_KEYS);
  if (!raw) return {};
  try {
    const m = JSON.parse(raw);
    return m && typeof m === 'object' ? (m as KeyMap) : {};
  } catch {
    return {};
  }
}

export async function setProviderKey(providerId: string, key: string): Promise<KeyMap> {
  const all = await getKeys();
  const next = { ...all, [providerId]: key.trim() };
  if (!key.trim()) delete next[providerId];
  await secureSet(K_KEYS, JSON.stringify(next));
  return next;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------
export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type AppSettings = {
  providerId: string;
  model: string;
  baseUrl: string;
  colorScheme: 'light' | 'dark' | 'system';
  systemPrompt: string;
};

const first = PRESETS[0];
export const defaultSettings: AppSettings = {
  providerId: first.id,
  model: first.models[0]?.id ?? '',
  baseUrl: first.baseUrl,
  colorScheme: 'system',
  systemPrompt: '',
};

export function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: `conv_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Untitled',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export async function loadConversations(): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(K_CONVS);
    if (!raw) return [];
    const list = JSON.parse(raw) as Conversation[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveConversations(list: Conversation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(K_CONVS, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(K_SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(s: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(K_SETTINGS, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** First user line becomes the conversation title, like the shipped app. */
export function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Untitled';
  const text = first.content.replace(/\s+/g, ' ').trim();
  if (!text) return 'Untitled';
  return text.length > 48 ? text.slice(0, 48).trimEnd() + '…' : text;
}

/**
 * Apply a provider switch while keeping preset defaults sane: when the new
 * provider differs, reset baseUrl/model unless the user already customised.
 */
export function applyProviderSwitch(s: AppSettings, providerId: string): AppSettings {
  const p = presetById(providerId);
  if (!p) return { ...s, providerId };
  const prev = presetById(s.providerId);
  const keepCustom = s.baseUrl && prev && s.baseUrl !== prev.baseUrl;
  return {
    ...s,
    providerId,
    baseUrl: keepCustom ? s.baseUrl : p.baseUrl,
    model: s.model && s.providerId === providerId ? s.model : p.models[0]?.id ?? '',
  };
}
