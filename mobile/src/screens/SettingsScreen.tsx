import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CdsIcon } from '../components/CdsIcon';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import { PRESETS, presetById, verifyProvider, type ProviderConfig } from '../providers';
import { applyProviderSwitch, type AppSettings, type KeyMap } from '../storage/store';

export function SettingsScreen({
  settings,
  keys,
  onChangeSettings,
  onChangeKey,
  onClose,
  firstRun,
}: {
  settings: AppSettings;
  keys: KeyMap;
  onChangeSettings: (s: AppSettings) => void;
  onChangeKey: (providerId: string, key: string) => void;
  onClose?: () => void;
  firstRun?: boolean;
}) {
  const { colors } = useTheme();
  const preset = presetById(settings.providerId);
  const activeKey = keys[settings.providerId] ?? '';
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const config = useMemo<ProviderConfig>(
    () => ({
      providerId: settings.providerId,
      kind: preset?.kind ?? 'openai',
      label: preset?.label ?? settings.providerId,
      baseUrl: settings.baseUrl,
      model: settings.model,
      apiKey: activeKey,
    }),
    [settings, preset, activeKey],
  );

  const check = async () => {
    setChecking(true);
    setStatus(null);
    const r = await verifyProvider(config);
    setStatus(r.message);
    setChecking(false);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <CdsIcon name="caret_right" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={{ color: colors.text, fontSize: type.title.size, fontWeight: '600' }}>
          {firstRun ? 'Connect a provider' : 'Settings'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.xxl, gap: space.xxl }}>
        <Text style={{ color: colors.textMuted, fontSize: type.label.size, lineHeight: type.label.lineHeight }}>
          Bring your own key. Keys are stored on this device only and are sent
          directly to the provider you choose.
        </Text>

        {/* Provider */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Provider</Text>
          <View style={styles.wrapRow}>
            {PRESETS.map((p) => {
              const on = p.id === settings.providerId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setStatus(null);
                    onChangeSettings(applyProviderSwitch(settings, p.id));
                  }}
                  style={[
                    styles.chip,
                    { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.bgSubtle : colors.surface },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: type.label.size }}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {preset?.note ? (
            <Text style={{ color: colors.textMuted, fontSize: type.caption.size }}>{preset.note}</Text>
          ) : null}
        </View>

        {/* Base URL */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Base URL</Text>
          <TextInput
            value={settings.baseUrl}
            onChangeText={(v) => onChangeSettings({ ...settings, baseUrl: v })}
            placeholder="https://api.example.com/v1"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
        </View>

        {/* API key */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            API key {preset ? `· ${preset.label}` : ''}
          </Text>
          <TextInput
            value={activeKey}
            onChangeText={(v) => onChangeKey(settings.providerId, v)}
            placeholder={preset?.keyPlaceholder ?? 'API key'}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
            <Pressable
              onPress={check}
              disabled={checking}
              style={[styles.btn, { borderColor: colors.border, opacity: checking ? 0.5 : 1 }]}
            >
              {checking ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Text style={{ color: colors.text, fontSize: type.label.size }}>Test connection</Text>
              )}
            </Pressable>
            {status ? (
              <Text style={{ color: colors.textMuted, fontSize: type.caption.size, flex: 1 }}>{status}</Text>
            ) : null}
          </View>
        </View>

        {/* Model */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Model</Text>
          {(preset?.models ?? []).map((m) => {
            const on = settings.model === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => onChangeSettings({ ...settings, model: m.id })}
                style={[styles.option, { borderColor: on ? colors.accent : colors.border, backgroundColor: colors.surface }]}
              >
                <Text style={{ color: colors.text, fontSize: type.label.size }}>{m.label}</Text>
                <Text style={{ color: colors.textMuted, fontSize: type.caption.size }}>{m.id}</Text>
              </Pressable>
            );
          })}
          <TextInput
            value={settings.model}
            onChangeText={(v) => onChangeSettings({ ...settings, model: v })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="or type any model id"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
        </View>

        {/* Appearance */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Appearance</Text>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            {(['light', 'dark', 'system'] as const).map((p) => {
              const on = settings.colorScheme === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => onChangeSettings({ ...settings, colorScheme: p })}
                  style={[
                    styles.chip,
                    { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.bgSubtle : colors.surface },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: type.label.size, textTransform: 'capitalize' }}>{p}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* System prompt */}
        <View style={{ gap: space.lg }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>System prompt (optional)</Text>
          <TextInput
            value={settings.systemPrompt}
            onChangeText={(v) => onChangeSettings({ ...settings, systemPrompt: v })}
            multiline
            placeholder="Applies to every conversation"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  label: { fontSize: type.caption.size, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
    fontSize: type.body.size,
    outlineStyle: 'none' as any,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  btn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
  },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
    gap: 2,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
  },
});
