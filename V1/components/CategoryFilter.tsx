import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'
import { ExperienceCategory } from '../types/models'
import { CATEGORIES } from '../constants/categories'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

interface CategoryFilterProps {
  selected: ExperienceCategory | null
  onSelect: (category: ExperienceCategory | null) => void
  style?: ViewStyle
}

export function CategoryFilter({ selected, onSelect, style }: CategoryFilterProps) {
  const allChip = { id: null, label: 'All', icon: '✨', color: Colors.accent }
  const chips = [allChip, ...CATEGORIES.map((c) => ({ id: c.id as ExperienceCategory | null, label: c.label, icon: c.icon, color: c.color }))]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {chips.map((chip) => {
        const isActive = chip.id === selected
        return (
          <TouchableOpacity
            key={chip.id ?? 'all'}
            onPress={() => onSelect(chip.id)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              isActive ? { backgroundColor: chip.color } : styles.chipInactive,
            ]}
          >
            <Text style={styles.icon}>{chip.icon}</Text>
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xxs + 3,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xxs + 2,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  labelActive: {
    color: Colors.textPrimary,
  },
  labelInactive: {
    color: Colors.textSecondary,
  },
})
