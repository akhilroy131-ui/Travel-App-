import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Spacing } from '../constants/theme'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  color?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  color = Colors.star,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1)

  if (interactive) {
    return (
      <View style={styles.row}>
        {stars.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange && onRatingChange(star)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: size, color: star <= rating ? color : '#3A3A3A', marginRight: 2 }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const filled = rating >= star - 0.5
        return (
          <Text key={star} style={{ fontSize: size, color: filled ? color : '#3A3A3A', marginRight: 2 }}>
            ★
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
