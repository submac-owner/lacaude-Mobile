import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CdsIcon } from './CdsIcon';
import { useTheme } from '../theme/ThemeProvider';
import { familyFor } from '../theme/ThemeProvider';
import { copy, radius, space, type } from '../theme/tokens';

/**
 * A plain up-arrow. NOTE: the artifact's cds icon set has no send/up-arrow
 * vector, so this glyph is [inferred] rather than ported.
 */
function ArrowUp({ size = 20, color }: { size?: number; color: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size, lineHeight: size * 1.05, color, fontWeight: '600' }}>↑</Text>
    </View>
  );
}

export function Composer({
  onSend,
  disabled,
  onAttach,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  onAttach?: () => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
      <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          onPress={onAttach}
          style={styles.leading}
          accessibilityLabel="Add"
          hitSlop={8}
        >
          <CdsIcon name="create" size={20} color={colors.textMuted} />
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={copy.composerPlaceholder}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: type.body.size,
              lineHeight: type.body.lineHeight,
              fontFamily: familyFor('sans'),
            },
          ]}
          onSubmitEditing={submit}
          blurOnSubmit={Platform.OS === 'web'}
        />

        {canSend ? (
          <Pressable
            onPress={submit}
            style={[styles.action, { backgroundColor: colors.accent }]}
            accessibilityLabel={copy.sendMessage}
            hitSlop={6}
          >
            <ArrowUp color={colors.onAccent} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.leading}
            accessibilityLabel="Voice"
            hitSlop={8}
          >
            <CdsIcon name="microphone" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xl, borderTopWidth: StyleSheet.hairlineWidth },
  box: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    gap: space.lg,
  },
  leading: { paddingBottom: 3 },
  input: { flex: 1, maxHeight: 160, paddingTop: 0, paddingBottom: 0, outlineStyle: 'none' as any },
  action: { width: 30, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
