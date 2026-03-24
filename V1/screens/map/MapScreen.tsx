import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing } from '../../constants/theme'

// Phase 8: Full Mapbox implementation
// Placeholder until @rnmapbox/maps native setup is complete
export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>🗺️</Text>
      <Text style={styles.label}>Map Screen</Text>
      <Text style={styles.sub}>Mapbox integration — Phase 8</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  placeholder: { fontSize: 48 },
  label: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
})
