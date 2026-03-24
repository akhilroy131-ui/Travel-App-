import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExperienceStackParamList } from '../../types/navigation'
import { useExperience } from '../../hooks/experiences/useExperience'
import { useReviews } from '../../hooks/reviews/useReviews'
import { PhotoGallery } from '../../components/PhotoGallery'
import { HostBadge } from '../../components/HostBadge'
import { StarRating } from '../../components/StarRating'
import { ReviewItem } from '../../components/ReviewItem'
import { ReviewForm } from '../../components/ReviewForm'
import { Tag } from '../../components/ui/Tag'
import { Divider } from '../../components/ui/Divider'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { getCategoryById } from '../../constants/categories'
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type Props = NativeStackScreenProps<ExperienceStackParamList, 'ExperienceDetail'>

export default function ExperienceDetailScreen({ route, navigation }: Props) {
  const { experienceId } = route.params
  const insets = useSafeAreaInsets()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  const { experience, loading, error, refresh } = useExperience(experienceId)
  const {
    reviews,
    loading: reviewsLoading,
    hasMore: reviewsHasMore,
    loadMore: loadMoreReviews,
    refresh: refreshReviews,
  } = useReviews(experienceId)

  const handleHostPress = useCallback(() => {
    if (experience?.host_id) {
      navigation.navigate('HostLanding', { hostId: experience.host_id })
    }
  }, [experience, navigation])

  const handleReviewSubmitSuccess = useCallback(() => {
    setShowReviewForm(false)
    refreshReviews()
    refresh() // refresh avg_rating on the experience
  }, [refreshReviews, refresh])

  if (loading) return <LoadingSpinner label="Loading experience…" />
  if (error || !experience) {
    return <ErrorMessage message={error ?? 'Experience not found'} onRetry={refresh} />
  }

  const category = getCategoryById(experience.category)
  const photos = experience.photos ?? []
  const hasPhotos = photos.length > 0
  const price = experience.price % 1 === 0
    ? experience.price.toFixed(0)
    : experience.price.toFixed(2)
  const currencySymbol = experience.currency === 'USD' ? '$' : experience.currency

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* Photo gallery — full bleed, no padding */}
        {hasPhotos ? (
          <PhotoGallery photos={photos} mode="carousel" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Content body */}
        <View style={styles.body}>
          {/* Category + title */}
          {category && (
            <Tag label={`${category.icon} ${category.label}`} color={category.color} size="sm" />
          )}
          <Text style={styles.title}>{experience.title}</Text>

          {/* Rating + review count */}
          <View style={styles.ratingRow}>
            <StarRating rating={experience.avg_rating} size={16} />
            <Text style={styles.ratingText}>
              {experience.avg_rating > 0 ? ` ${experience.avg_rating.toFixed(1)}` : ' New'}
              {experience.review_count > 0 ? ` · ${experience.review_count} reviews` : ''}
            </Text>
          </View>

          {/* Location + duration */}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>📍 {experience.location_name}</Text>
            {experience.duration_minutes ? (
              <Text style={styles.meta}>
                🕐 {experience.duration_minutes >= 60
                  ? `${Math.floor(experience.duration_minutes / 60)}h${experience.duration_minutes % 60 > 0 ? ` ${experience.duration_minutes % 60}m` : ''}`
                  : `${experience.duration_minutes}m`}
              </Text>
            ) : null}
            {experience.max_guests ? (
              <Text style={styles.meta}>👥 Up to {experience.max_guests}</Text>
            ) : null}
          </View>

          <Divider style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About this experience</Text>
          <Text style={styles.description}>{experience.description}</Text>

          <Divider style={styles.divider} />

          {/* Host badge — large variant */}
          {experience.host && (
            <>
              <Text style={styles.sectionTitle}>Your host</Text>
              <HostBadge
                host={experience.host}
                avgRating={undefined}
                reviewCount={undefined}
                variant="large"
                onPress={handleHostPress}
              />
              <Divider style={styles.divider} />
            </>
          )}

          {/* Reviews section */}
          <SectionHeader
            title={`Reviews${experience.review_count > 0 ? ` (${experience.review_count})` : ''}`}
            actionLabel={showReviewForm ? 'Cancel' : 'Write a review'}
            onActionPress={() => setShowReviewForm((v) => !v)}
          />

          {showReviewForm && (
            <View style={styles.reviewFormWrap}>
              <ReviewForm
                experienceId={experienceId}
                onSubmitSuccess={handleReviewSubmitSuccess}
              />
              <Divider style={styles.divider} />
            </View>
          )}

          {/* Review list */}
          {reviews.map((review, index) => (
            <View key={review.id}>
              <ReviewItem review={review} />
              {index < reviews.length - 1 && <Divider />}
            </View>
          ))}

          {reviewsHasMore && (
            <TouchableOpacity onPress={loadMoreReviews} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreText}>Load more reviews</Text>
            </TouchableOpacity>
          )}

          {reviewsLoading && <LoadingSpinner size="small" style={styles.reviewSpinner} />}

          {reviews.length === 0 && !reviewsLoading && (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
            </View>
          )}
        </View>

        {/* Bottom padding for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Back button — outside ScrollView so it stays fixed while scrolling */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      {/* Sticky bottom bar: price + book CTA */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceAmount}>
            {currencySymbol}{price}
          </Text>
          <Text style={styles.perPerson}>per person</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.85}>
          <Text style={styles.bookButtonText}>Book Experience</Text>
          <Text style={styles.bookButtonSub}>v2 — coming soon</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.base,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
    marginLeft: -2,
  },
  body: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.xl * 1.25,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  meta: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  description: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.size.base * 1.6,
  },
  reviewFormWrap: {
    gap: Spacing.sm,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  loadMoreText: {
    fontSize: Typography.size.sm,
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  reviewSpinner: {
    flex: 0,
    paddingVertical: Spacing.md,
  },
  noReviews: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  // Sticky bottom bar
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    ...Shadow.lg,
  },
  priceBlock: {
    gap: 2,
  },
  priceAmount: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.accent,
  },
  perPerson: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  bookButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  bookButtonSub: {
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
})
