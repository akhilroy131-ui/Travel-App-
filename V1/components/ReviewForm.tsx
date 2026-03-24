import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native'
import { useSubmitReview } from '../hooks/reviews/useSubmitReview'
import { StarRating } from './StarRating'
import { Button } from './ui/Button'
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme'

interface ReviewFormProps {
  experienceId: string
  onSubmitSuccess?: () => void
}

export function ReviewForm({ experienceId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const { submit, loading, error } = useSubmitReview()

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.')
      return
    }
    const success = await submit({ experienceId, rating, body })
    if (success) {
      setRating(0)
      setBody('')
      onSubmitSuccess?.()
    } else {
      Alert.alert('Error', error ?? 'Could not submit review. Please try again.')
    }
  }

  return (
    <View style={styles.container}>
      {/* v1 info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Complete a booking to review this experience. You can still leave a review now — it will
          be linked to your booking in a future update.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Your rating</Text>
      <StarRating
        rating={rating}
        size={32}
        interactive
        onRatingChange={setRating}
      />

      <Text style={styles.sectionLabel}>Your review (optional)</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Share what made this experience special…"
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={4}
        style={styles.input}
        textAlignVertical="top"
      />

      <Button
        label="Submit Review"
        onPress={handleSubmit}
        loading={loading}
        disabled={rating === 0}
        style={styles.submitButton}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.size.xs * 1.6,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    minHeight: 100,
  },
  submitButton: {
    marginTop: Spacing.xxs,
  },
})
