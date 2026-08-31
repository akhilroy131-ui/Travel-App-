import React from 'react'
import { View, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native'
import { Image } from 'expo-image'
import { Colors, Typography, BorderRadius } from '../../constants/theme'

interface AvatarProps {
  uri: string | null
  size?: number
  fallbackInitials?: string
  style?: StyleProp<ImageStyle>
}

export function Avatar({ uri, size = 40, fallbackInitials, style }: AvatarProps) {
  const borderRadius = size / 2
  const fontSize = size * 0.38

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius }, style]}
        contentFit="cover"
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius, backgroundColor: Colors.surfaceElevated },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>
        {fallbackInitials ? fallbackInitials.substring(0, 2).toUpperCase() : '?'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  initials: {
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold,
  },
})
