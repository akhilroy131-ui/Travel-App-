import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ExperienceStackParamList } from '../../types/navigation'
import { Colors, Typography, Spacing } from '../../constants/theme'

type Props = NativeStackScreenProps<ExperienceStackParamList, 'ExperienceDetail'>

// Phase 5: Full implementation with PhotoGallery, ReviewList, HostBadge
export default function ExperienceDetailScreen({ route }: Props) {
  const { experienceId } = route.params
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>🎟️</Text>
      <Text style={styles.label}>Experience Detail</Text>
      <Text style={styles.sub}>ID: {experienceId}</Text>
      <Text style={styles.sub}>Phase 5 — full detail view</Text>
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
