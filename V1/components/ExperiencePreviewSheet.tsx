/**
 * ExperiencePreviewSheet
 *
 * Documented exception to the "no data fetching in components" rule.
 * This bottom sheet is rendered directly inside MapScreen and fetches its
 * own data because it is tightly coupled to the selected pin state on the
 * map — lifting the fetch up would require MapScreen to track a full
 * Experience object rather than just the selected pin ID.
 */
import React, { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { useExperience } from '../hooks/experiences/useExperience'
import { StarRating } from './StarRating'
import { Tag } from './ui/Tag'
import { CATEGORIES } from '../constants/categories'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

interface ExperiencePreviewSheetProps {
  experienceId: string | null
  onViewDetail: (experienceId: string) => void
  onDismiss: () => void
}

export function ExperiencePreviewSheet({
  experienceId,
  onViewDetail,
  onDismiss,
}: ExperiencePreviewSheetProps) {
  const { experience, loading, error } = useExperience(experienceId)

  // Slide-up animation
  const translateY = React.useRef(new Animated.Value(200)).current

  useEffect(() => {
    if (experienceId) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: 200,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [experienceId, translateY])

  if (!experienceId) return null

  const category = experience
    ? CATEGORIES.find((c) => c.id === experience.category)
    : null

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* Dismiss tap outside area (invisible) */}
      <TouchableOpacity style={styles.dismissArea} onPress={onDismiss} activeOpacity={1} />

      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.accent} size="small" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : error || !experience ? (
          <View style={styles.loadingRow}>
            <Text style={styles.errorText}>Could not load experience.</Text>
          </View>
        ) : (
          <>
            {/* Thumbnail */}
            {experience.cover_image_url ? (
              <Image
                source={{ uri: experience.cover_image_url }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                <Text style={styles.thumbnailEmoji}>{category?.icon ?? '📍'}</Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.info}>
              {category && (
                <Tag
                  label={category.label}
                  color={category.color}
                  textColor={Colors.textPrimary}
                  size="sm"
                />
              )}
              <Text style={styles.title} numberOfLines={2}>
                {experience.title}
              </Text>
              <View style={styles.metaRow}>
                <StarRating rating={experience.avg_rating} size={13} />
                {experience.review_count > 0 && (
                  <Text style={styles.reviewCount}>
                    ({experience.review_count})
                  </Text>
                )}
                <Text style={styles.dot}>·</Text>
                <Text style={styles.price}>
                  {experience.price === 0
                    ? 'Free'
                    : `$${experience.price.toFixed(0)}`}
                </Text>
              </View>
              {experience.location_name ? (
                <Text style={styles.location} numberOfLines={1}>
                  📍 {experience.location_name}
                </Text>
              ) : null}
            </View>

            {/* View button */}
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => onViewDetail(experience.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  )
}

const THUMB_SIZE = 72

const styles = StyleSheet.create({
  dismissArea: {
    position: 'absolute',
    top: -200,
    left: 0,
    right: 0,
    height: 200,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: Spacing.base,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.md,
    flexShrink: 0,
  },
  thumbnailFallback: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: Spacing.xxs + 1,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.base * 1.35,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewCount: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  price: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
  },
  location: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  viewBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  viewBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  loadingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.error,
  },
})
