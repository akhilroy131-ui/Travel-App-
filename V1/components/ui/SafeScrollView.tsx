import React from 'react'
import { ScrollView, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '../../constants/theme'

interface SafeScrollViewProps {
  children: React.ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

export function SafeScrollView({ children, style, contentContainerStyle }: SafeScrollViewProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
})
