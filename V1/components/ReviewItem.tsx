import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Review } from '../types/models'
import { Avatar } from './ui/Avatar'
import { StarRating } from './StarRating'
import { Colors, Typography, Spacing } from '../constants/theme'

interface ReviewItemProps {
  review: Review
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function ReviewItem({ review }: ReviewItemProps) {
  const author = review.author

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar
          uri={author?.avatar_url ?? null}
          size={36}
          fallbackInitials={author?.display_name}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{author?.display_name ?? 'Anonymous'}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={review.rating} size={12} />
            <Text style={styles.date}> · {formatDate(review.created_at)}</Text>
          </View>
        </View>
      </View>
      {review.body ? <Text style={styles.body}>{review.body}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  name: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  body: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.55,
  },
})
