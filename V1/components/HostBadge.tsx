import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Profile } from '../types/models'
import { Avatar } from './ui/Avatar'
import { StarRating } from './StarRating'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

type HostBadgeVariant = 'small' | 'large'

interface HostBadgeProps {
  host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
  avgRating?: number
  reviewCount?: number
  variant?: HostBadgeVariant
  onPress?: () => void
  style?: ViewStyle
}

export function HostBadge({
  host,
  avgRating,
  reviewCount,
  variant = 'small',
  onPress,
  style,
}: HostBadgeProps) {
  if (variant === 'small') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
        style={[styles.smallPill, style]}
      >
        <Avatar uri={host.avatar_url} size={24} fallbackInitials={host.display_name} />
        <Text style={styles.smallName} numberOfLines={1}>
          {host.display_name}
        </Text>
        {avgRating != null && avgRating > 0 && (
          <View style={styles.smallRatingBadge}>
            <Text style={styles.smallRatingText}>★ {avgRating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Large variant — used on ExperienceDetailScreen
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[styles.largeContainer, style]}
    >
      <View style={styles.largeAvatarWrap}>
        <Avatar uri={host.avatar_url} size={56} fallbackInitials={host.display_name} />
        {avgRating != null && avgRating > 0 && (
          <View style={styles.largeRatingBadge}>
            <Text style={styles.largeRatingBadgeText}>★ {avgRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.largeInfo}>
        <Text style={styles.largeLabel}>Hosted by</Text>
        <Text style={styles.largeName}>{host.display_name}</Text>
        {avgRating != null && avgRating > 0 && (
          <View style={styles.largeRatingRow}>
            <StarRating rating={avgRating} size={13} />
            <Text style={styles.largeRatingText}>
              {' '}
              {avgRating.toFixed(1)}
              {reviewCount != null ? ` (${reviewCount} reviews)` : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Small variant
  smallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayHeavy,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xxs + 1,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
    gap: Spacing.xxs + 2,
  },
  smallName: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    maxWidth: 100,
  },
  smallRatingBadge: {
    backgroundColor: Colors.star,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xxs + 2,
    paddingVertical: 1,
  },
  smallRatingText: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.textInverse,
  },

  // Large variant
  largeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  largeAvatarWrap: {
    position: 'relative',
  },
  largeRatingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.star,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xxs + 2,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  largeRatingBadgeText: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: Colors.textInverse,
  },
  largeInfo: {
    flex: 1,
  },
  largeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  largeName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  largeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeRatingText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
})
