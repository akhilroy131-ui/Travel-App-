import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '../../constants/theme'

interface DividerProps {
  style?: ViewStyle
}

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
})
