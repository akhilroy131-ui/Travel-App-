import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Typography, Spacing } from '../../constants/theme'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  label?: string
  style?: ViewStyle
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.accent,
  label,
  style,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  label: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
})
