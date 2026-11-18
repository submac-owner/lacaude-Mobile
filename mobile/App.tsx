import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {
  defaultSettings,
  getKeys,
  loadSettings,
  saveSettings,
  setProviderKey,
  type AppSettings,
  type KeyMap,
} from './src/storage/store';

export default function App() {
  const [ready, setReady] = useState(false);
  const [keys, setKeys] = useState<KeyMap>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const [k, s] = await Promise.all([getKeys(), loadSettings()]);
      setKeys(k);
      setSettings(s);
      setReady(true);
    })();
  }, []);

  const updateKey = (providerId: string, key: string) => {
    setKeys((prev) => {
      const next = { ...prev, [providerId]: key };
      if (!key.trim()) delete next[providerId];
      return next;
    });
    void setProviderKey(providerId, key);
  };

  const updateSettings = (s: AppSettings) => {
    setSettings(s);
    void saveSettings(s);
  };

  if (!ready) {
    return (
      <ThemeProvider pref="system">
        <Shell>
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        </Shell>
      </ThemeProvider>
    );
  }

  const connected = Boolean((keys[settings.providerId] ?? '').trim() && settings.baseUrl.trim() && settings.model.trim());

  return (
    <ThemeProvider pref={settings.colorScheme}>
      <Shell>
        {!connected || showSettings ? (
          <SettingsScreen
            settings={settings}
            keys={keys}
            onChangeSettings={updateSettings}
            onChangeKey={updateKey}
            onClose={connected ? () => setShowSettings(false) : undefined}
            firstRun={!connected}
          />
        ) : (
          <ChatScreen settings={settings} keys={keys} onOpenSettings={() => setShowSettings(true)} />
        )}
      </Shell>
    </ThemeProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
