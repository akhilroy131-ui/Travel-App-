import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { Button } from './Button'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Try Again" onPress={onRetry} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emoji: {
    fontSize: 36,
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.size.base * 1.5,
  },
  button: {
    minWidth: 140,
  },
})
