import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ClaudeMark } from './ClaudeMark';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import type { ChatMessage } from '../anthropic/client';

function textOf(m: ChatMessage): string {
  return typeof m.content === 'string'
    ? m.content
    : m.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

export function MessageRow({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const text = textOf(message);

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={[styles.bubble, { backgroundColor: colors.bgSubtle }]}>
          <Text style={{ color: colors.text, fontSize: type.body.size, lineHeight: type.body.lineHeight }}>
            {text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      {streaming && !text ? (
        <View style={{ marginBottom: space.lg }}>
          <ClaudeMark size={20} color={colors.accent} />
        </View>
      ) : null}
      {text ? (
        <Text style={{ color: colors.text, fontSize: type.body.size, lineHeight: type.body.lineHeight }}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', paddingHorizontal: space.xl, paddingVertical: space.md },
  bubble: { maxWidth: '86%', borderRadius: radius.xl, paddingHorizontal: space.xxl, paddingVertical: space.xl },
  assistantRow: { paddingHorizontal: space.xl, paddingVertical: space.md },
});
