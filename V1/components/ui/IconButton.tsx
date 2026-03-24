import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Colors, BorderRadius } from '../../constants/theme'

interface IconButtonProps {
  icon: React.ReactElement
  onPress: () => void
  size?: number
  backgroundColor?: string
  style?: ViewStyle
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  backgroundColor = Colors.surfaceElevated,
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
