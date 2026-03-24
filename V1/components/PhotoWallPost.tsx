import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Post } from '../types/models'
import { Colors, Typography, Spacing } from '../constants/theme'

interface PhotoWallPostProps {
  post: Post
  size: number
  onPress: () => void
  onLikePress?: () => void
  isLiked?: boolean
}

export function PhotoWallPost({
  post,
  size,
  onPress,
  onLikePress,
  isLiked = false,
}: PhotoWallPostProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.tile, { width: size, height: size }]}
    >
      <Image
        source={{ uri: post.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      {/* Like overlay — bottom of tile */}
      <View style={styles.overlay}>
        <TouchableOpacity
          onPress={onLikePress}
          disabled={!onLikePress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.heart, isLiked && styles.heartLiked]}>
            {isLiked ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        {post.like_count > 0 && (
          <Text style={styles.likeCount}>
            {post.like_count >= 1000
              ? `${(post.like_count / 1000).toFixed(1)}k`
              : post.like_count}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxs + 2,
    paddingBottom: Spacing.xxs + 2,
    paddingTop: Spacing.sm,
    gap: Spacing.xxs,
    // subtle gradient effect via background
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heart: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  heartLiked: {
    color: '#FF4D6D',
  },
  likeCount: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold,
  },
})
