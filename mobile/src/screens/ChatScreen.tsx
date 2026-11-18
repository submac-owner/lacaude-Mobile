import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Composer } from '../components/Composer';
import { CdsIcon } from '../components/CdsIcon';
import { ClaudeMark } from '../components/ClaudeMark';
import { MessageRow } from '../components/MessageRow';
import { useTheme } from '../theme/ThemeProvider';
import { copy, space, type } from '../theme/tokens';
import { configProblem, presetById, streamChat, type ChatMessage, type ProviderConfig } from '../providers';
import {
  deriveTitle,
  loadConversations,
  newConversation,
  saveConversations,
  type AppSettings,
  type Conversation,
  type KeyMap,
} from '../storage/store';

export function ChatScreen({
  settings,
  keys,
  onOpenSettings,
}: {
  settings: AppSettings;
  keys: KeyMap;
  onOpenSettings: () => void;
}) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const preset = presetById(settings.providerId);
  const config = useMemo<ProviderConfig>(
    () => ({
      providerId: settings.providerId,
      kind: preset?.kind ?? 'openai',
      label: preset?.label ?? settings.providerId,
      baseUrl: settings.baseUrl,
      model: settings.model,
      apiKey: keys[settings.providerId] ?? '',
    }),
    [settings, preset, keys],
  );
  const problem = configProblem(config);

  const current = useMemo(
    () => conversations.find((c) => c.id === currentId) ?? null,
    [conversations, currentId],
  );

  useEffect(() => {
    (async () => {
      const list = await loadConversations();
      if (list.length) {
        setConversations(list);
        setCurrentId(list[list.length - 1].id);
      } else {
        const c = newConversation();
        setConversations([c]);
        setCurrentId(c.id);
      }
      setReady(true);
    })();
  }, []);

  const persist = useCallback((list: Conversation[]) => {
    setConversations(list);
    void saveConversations(list);
  }, []);

  const startNew = useCallback(() => {
    const c = newConversation();
    persist([c, ...conversations]);
    setCurrentId(c.id);
    setShowList(false);
    setError(null);
  }, [conversations, persist]);

  const update = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? fn(c) : c));
      void saveConversations(next);
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!current) return;
      if (problem) {
        setError(problem);
        return;
      }
      setError(null);
      const history: ChatMessage[] = [...current.messages, { role: 'user', content: text }];
      update(current.id, (c) => ({
        ...c,
        messages: [...history, { role: 'assistant', content: '' }],
        title: c.messages.length === 0 ? deriveTitle(history) : c.title,
        updatedAt: Date.now(),
      }));

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      let acc = '';
      let sawError = false;
      try {
        for await (const ev of streamChat({
          config,
          system: settings.systemPrompt || undefined,
          messages: history,
          signal: controller.signal,
        })) {
          if (ev.kind === 'text') {
            acc += ev.text;
            update(current.id, (c) => {
              const msgs = [...c.messages];
              msgs[msgs.length - 1] = { role: 'assistant', content: acc };
              return { ...c, messages: msgs, updatedAt: Date.now() };
            });
          } else if (ev.kind === 'error') {
            sawError = true;
            setError(ev.message);
            update(current.id, (c) => {
              const msgs = [...c.messages];
              if (!acc) msgs.pop();
              return { ...c, messages: msgs };
            });
          }
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        if (sawError && !acc) setError((e) => e ?? copy.sendFailed);
      }
    },
    [config, current, problem, settings.systemPrompt, update],
  );

  const stop = () => abortRef.current?.abort();

  if (!ready) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  const messages = current?.messages ?? [];

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setShowList((v) => !v)} hitSlop={8} accessibilityLabel="Chats">
          <CdsIcon name="chats" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={onOpenSettings} accessibilityLabel="Settings" style={styles.titleBtn}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: type.label.size, fontWeight: '500' }}>
            {preset?.label ?? settings.providerId}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: type.caption.size }}>
            {settings.model || 'no model'}
          </Text>
        </Pressable>
        <Pressable onPress={startNew} hitSlop={8} accessibilityLabel="New chat">
          <CdsIcon name="create" size={22} color={colors.text} />
        </Pressable>
      </View>

      {showList ? (
        <View style={[styles.listOverlay, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {conversations.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setCurrentId(c.id);
                setShowList(false);
              }}
              style={[styles.listRow, c.id === currentId && { backgroundColor: colors.bgSubtle }]}
            >
              <Text numberOfLines={1} style={{ color: colors.text, fontSize: type.label.size }}>
                {c.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FlatList
        style={styles.flex}
        contentContainerStyle={messages.length === 0 ? styles.flex : styles.listContent}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <MessageRow
            message={item}
            streaming={streaming && index === messages.length - 1 && item.role === 'assistant'}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.flex, styles.center, { gap: space.xxl }]}>
            <ClaudeMark size={64} color={colors.accent} />
            <Text style={{ color: colors.textMuted, fontSize: type.label.size }}>{copy.composerPlaceholder}</Text>
          </View>
        }
      />

      {problem ? (
        <Pressable onPress={onOpenSettings} style={[styles.banner, { backgroundColor: colors.bgSubtle }]}>
          <Text style={{ color: colors.text, fontSize: type.caption.size }}>
            {problem} Tap to open Settings.
          </Text>
        </Pressable>
      ) : error ? (
        <View style={[styles.banner, { backgroundColor: colors.bgSubtle }]}>
          <Text style={{ color: colors.danger, fontSize: type.caption.size }}>
            {copy.sendFailed} — {error}
          </Text>
        </View>
      ) : null}

      {streaming ? (
        <Pressable onPress={stop} style={styles.stop} accessibilityLabel="Stop">
          <CdsIcon name="stop_filled" size={20} color={colors.text} />
        </Pressable>
      ) : null}

      <Composer onSend={send} disabled={streaming} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: Platform.OS === 'android' ? space.xxxl : space.xl,
    gap: space.xl,
  },
  titleBtn: { flex: 1, alignItems: 'center' },
  listOverlay: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.lg },
  listRow: { paddingHorizontal: space.xxl, paddingVertical: space.xl },
  listContent: { paddingVertical: space.xxl },
  banner: { paddingHorizontal: space.xxl, paddingVertical: space.lg },
  stop: { alignItems: 'center', paddingVertical: space.lg },
});
