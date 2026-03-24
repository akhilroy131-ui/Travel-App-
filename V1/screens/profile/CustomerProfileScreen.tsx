import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing } from '../../constants/theme'

// Phase 7: Full implementation with PhotoWall, post upload, like functionality
export default function CustomerProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>👤</Text>
      <Text style={styles.label}>My Profile</Text>
      <Text style={styles.sub}>Phase 7 — photo wall + posts</Text>
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
