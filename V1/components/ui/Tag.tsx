import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

interface TagProps {
  label: string
  color?: string
  textColor?: string
  size?: 'sm' | 'md'
  style?: ViewStyle
}

export function Tag({
  label,
  color = Colors.accent,
  textColor = Colors.textPrimary,
  size = 'md',
  style,
}: TagProps) {
  return (
    <View style={[styles.base, size === 'sm' ? styles.sm : styles.md, { backgroundColor: color }, style]}>
      <Text style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd, { color: textColor }]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  md: {
    paddingVertical: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm + 2,
  },
  sm: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontWeight: Typography.weight.semibold,
  },
  labelMd: {
    fontSize: Typography.size.sm,
  },
  labelSm: {
    fontSize: Typography.size.xs,
  },
})
