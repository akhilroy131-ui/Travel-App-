import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { Experience } from '../types/models'
import { getCategoryById } from '../constants/categories'
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/theme'
import { Tag } from './ui/Tag'
import { StarRating } from './StarRating'
import { HostBadge } from './HostBadge'

interface ExperienceCardProps {
  experience: Experience
  onPress: (id: string) => void
  style?: ViewStyle
}

export function ExperienceCard({ experience, onPress, style }: ExperienceCardProps) {
  const category = getCategoryById(experience.category)
  const imageAspect = CARD_WIDTH / (CARD_WIDTH * (9 / 16))

  return (
    <TouchableOpacity
      onPress={() => onPress(experience.id)}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      {/* Cover image */}
      <View style={styles.imageContainer}>
        <Image
          source={experience.cover_image_url ? { uri: experience.cover_image_url } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Category tag — top left */}
        {category && (
          <View style={styles.categoryTag}>
            <Tag
              label={`${category.icon} ${category.label}`}
              color={category.color}
              size="sm"
            />
          </View>
        )}

        {/* Host badge — bottom left */}
        {experience.host && (
          <View style={styles.hostBadge}>
            <HostBadge
              host={experience.host}
              avgRating={experience.host ? undefined : undefined}
              variant="small"
            />
          </View>
        )}
      </View>

      {/* Info row */}
      <View style={styles.info}>
        <View style={styles.infoLeft}>
          <Text style={styles.title} numberOfLines={2}>
            {experience.title}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating rating={experience.avg_rating} size={13} />
            <Text style={styles.ratingText}>
              {' '}
              {experience.avg_rating > 0 ? experience.avg_rating.toFixed(1) : 'New'}
              {experience.review_count > 0 ? ` (${experience.review_count})` : ''}
            </Text>
          </View>
          <Text style={styles.location} numberOfLines={1}>
            📍 {experience.location_name}
          </Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceAmount}>
            {experience.currency === 'USD' ? '$' : experience.currency}
            {experience.price % 1 === 0
              ? experience.price.toFixed(0)
              : experience.price.toFixed(2)}
          </Text>
          <Text style={styles.perPerson}>/ person</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  hostBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoLeft: {
    flex: 1,
    gap: Spacing.xxs + 2,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.base * 1.35,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  location: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
  },
  perPerson: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
})
