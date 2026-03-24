import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ExperienceStackParamList } from '../../types/navigation'
import { Colors, Typography, Spacing } from '../../constants/theme'

type Props = NativeStackScreenProps<ExperienceStackParamList, 'HostLanding'>

// Phase 6: Full implementation with host profile, experiences list, PhotoWall
export default function HostLandingScreen({ route }: Props) {
  const { hostId } = route.params
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>🏡</Text>
      <Text style={styles.label}>Host Profile</Text>
      <Text style={styles.sub}>Host ID: {hostId}</Text>
      <Text style={styles.sub}>Phase 6 — host landing page</Text>
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
