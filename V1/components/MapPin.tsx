import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ExperiencePin } from '../types/models'
import { CATEGORIES } from '../constants/categories'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

interface MapPinProps {
  pin: ExperiencePin
  isSelected: boolean
  onPress: (pin: ExperiencePin) => void
}

function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `$${Math.round(price)}`
}

export function MapPin({ pin, isSelected, onPress }: MapPinProps) {
  const category = CATEGORIES.find((c) => c.id === pin.category)
  const accentColor = category?.color ?? Colors.accent

  return (
    <TouchableOpacity
      onPress={() => onPress(pin)}
      activeOpacity={0.85}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: isSelected ? accentColor : Colors.surface },
          isSelected && styles.bubbleSelected,
        ]}
      >
        <Text style={styles.icon}>{category?.icon ?? '📍'}</Text>
        <Text
          style={[
            styles.price,
            { color: isSelected ? Colors.textPrimary : accentColor },
          ]}
        >
          {formatPrice(pin.price)}
        </Text>
      </View>
      {/* Pointer triangle */}
      <View
        style={[
          styles.pointer,
          { borderTopColor: isSelected ? accentColor : Colors.surface },
        ]}
      />
    </TouchableOpacity>
  )
}

const BUBBLE_HEIGHT = 36

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    height: BUBBLE_HEIGHT,
    minWidth: 64,
    justifyContent: 'center',
  },
  bubbleSelected: {
    borderColor: Colors.transparent,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 14,
    lineHeight: 18,
  },
  price: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: Colors.transparent,
    borderRightColor: Colors.transparent,
    marginTop: -1,
  },
})
