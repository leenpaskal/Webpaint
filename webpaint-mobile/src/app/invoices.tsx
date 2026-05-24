import { StyleSheet, Text, View } from 'react-native';

export default function InvoicesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
});
