import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ExperienceStackParamList } from '../../types/navigation'
import { Colors, Typography, Spacing } from '../../constants/theme'

type Props = NativeStackScreenProps<ExperienceStackParamList, 'ExperiencesList'>

// Phase 4: Full implementation with FlatList, CategoryFilter, useExperiences hook
export default function ExperiencesListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>🧭</Text>
      <Text style={styles.label}>Experiences</Text>
      <Text style={styles.sub}>Phase 4 — list + filters</Text>
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
