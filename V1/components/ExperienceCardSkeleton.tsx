import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

interface ExperienceCardSkeletonProps {
  style?: ViewStyle
}

export function ExperienceCardSkeleton({ style }: ExperienceCardSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View style={[styles.card, { opacity }, style]}>
      {/* Image placeholder */}
      <View style={styles.image} />

      {/* Info row */}
      <View style={styles.info}>
        <View style={styles.infoLeft}>
          <View style={styles.titleLine} />
          <View style={styles.titleLineShort} />
          <View style={styles.metaLine} />
          <View style={styles.metaLineShort} />
        </View>
        <View style={styles.pricePlaceholder} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleLine: {
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceElevated,
    width: '85%',
  },
  titleLineShort: {
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceElevated,
    width: '60%',
  },
  metaLine: {
    height: 11,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceElevated,
    width: '50%',
    marginTop: Spacing.xxs,
  },
  metaLineShort: {
    height: 11,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceElevated,
    width: '40%',
  },
  pricePlaceholder: {
    width: 52,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    flexShrink: 0,
  },
})
