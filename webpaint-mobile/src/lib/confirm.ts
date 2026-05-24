import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm. On native it uses Alert.alert (two-button
 * destructive-style); on web it falls back to window.confirm so the
 * Expo-web build still works (Alert.alert is a no-op there).
 */
export function confirmDestructive(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
  } = opts;

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(
      typeof window !== 'undefined' ? window.confirm(text) : false,
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => resolve(true),
      },
    ]);
  });
}
