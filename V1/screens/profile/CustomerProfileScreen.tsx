import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../hooks/auth/useAuth'
import { useProfile } from '../../hooks/profiles/useProfile'
import { useUpdateProfile } from '../../hooks/profiles/useUpdateProfile'
import { usePosts } from '../../hooks/posts/usePosts'
import { useCreatePost } from '../../hooks/posts/useCreatePost'
import { useToggleLike } from '../../hooks/posts/useToggleLike'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Divider } from '../../components/ui/Divider'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { PhotoWall } from '../../components/PhotoWall'
import { Post } from '../../types/models'
import { uploadAvatar, pickImageFromLibrary } from '../../lib/storage'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

// Optimistic like state: track which post IDs the user has liked locally
type LikeMap = Record<string, boolean>

export default function CustomerProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()
  const userId = user?.id ?? null

  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useProfile(userId)
  const { posts, loading: postsLoading, hasMore, loadMore, refresh: refreshPosts } = usePosts({ authorId: userId })
  const { update: updateProfile, loading: updateLoading } = useUpdateProfile()
  const { create: createPost, loading: createLoading } = useCreatePost()
  const { toggleLike } = useToggleLike(userId)

  // Edit profile modal state
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Optimistic like state
  const [likeMap, setLikeMap] = useState<LikeMap>({})

  const openEdit = useCallback(() => {
    setEditName(profile?.display_name ?? '')
    setEditBio(profile?.bio ?? '')
    setEditVisible(true)
  }, [profile])

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return
    const ok = await updateProfile(userId, {
      display_name: editName.trim() || undefined,
      bio: editBio.trim() || undefined,
    })
    if (ok) {
      setEditVisible(false)
      refreshProfile()
    }
  }, [userId, editName, editBio, updateProfile, refreshProfile])

  const handleChangeAvatar = useCallback(async () => {
    if (!userId) return
    const uri = await pickImageFromLibrary()
    if (!uri) return

    setAvatarUploading(true)
    const url = await uploadAvatar(userId, uri)
    if (url) {
      await updateProfile(userId, { avatar_url: url })
      refreshProfile()
    } else {
      Alert.alert('Upload failed', 'Could not upload avatar. Please try again.')
    }
    setAvatarUploading(false)
  }, [userId, updateProfile, refreshProfile])

  const handleCreatePost = useCallback(async () => {
    if (!userId) return
    const uri = await pickImageFromLibrary()
    if (!uri) return

    const ok = await createPost(userId, { imageUri: uri })
    if (ok) {
      refreshPosts()
    } else {
      Alert.alert('Post failed', 'Could not create post. Please try again.')
    }
  }, [userId, createPost, refreshPosts])

  const handleLikePress = useCallback(
    async (postId: string) => {
      const currentlyLiked = !!likeMap[postId]
      // Optimistic update
      setLikeMap((prev) => ({ ...prev, [postId]: !currentlyLiked }))
      await toggleLike(postId, currentlyLiked)
    },
    [likeMap, toggleLike]
  )

  const handlePostPress = useCallback((post: Post) => {
    Alert.alert(post.caption ?? 'Photo', 'Full post view coming in Phase 7 detail.')
  }, [])

  if (profileLoading) return <LoadingSpinner label="Loading profile…" />
  if (profileError || !profile) {
    return <ErrorMessage message={profileError ?? 'Profile not found'} onRetry={refreshProfile} />
  }

  const PhotoWallHeader = (
    <View style={styles.wallHeader}>
      <SectionHeader title={`My Photos (${posts.length})`} />
    </View>
  )

  const PhotoWallEmpty = (
    <View style={styles.emptyWall}>
      {postsLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        <>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyText}>No photos yet. Tap + to share your first!</Text>
        </>
      )}
    </View>
  )

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          {/* Avatar + change button */}
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8} disabled={avatarUploading}>
            <Avatar
              uri={profile.avatar_url}
              size={88}
              fallbackInitials={profile.display_name}
              style={styles.avatar}
            />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>{avatarUploading ? '…' : '✎'}</Text>
            </View>
          </TouchableOpacity>

          {/* Name + host status */}
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.hostStatus}>
            {profile.is_host ? 'Host on Roam' : 'Traveller'}
          </Text>

          {/* Bio */}
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>Add a bio…</Text>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill label="Posts" value={posts.length} />
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              label="Edit Profile"
              onPress={openEdit}
              variant="secondary"
              style={styles.editBtn}
            />
            <Button
              label="Sign Out"
              onPress={signOut}
              variant="ghost"
              style={styles.signOutBtn}
            />
          </View>
        </View>

        <Divider />

        {/* Photo wall */}
        <View style={styles.wallSection}>
          <PhotoWall
            posts={posts}
            onPostPress={handlePostPress}
            onLikePress={handleLikePress}
            isLikedMap={likeMap}
            currentUserId={userId ?? undefined}
            ListHeaderComponent={PhotoWallHeader}
            ListEmptyComponent={PhotoWallEmpty}
          />
          {hasMore && posts.length > 0 && (
            <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* FAB — create post */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + Spacing.xl }]}
        onPress={handleCreatePost}
        activeOpacity={0.85}
        disabled={createLoading}
      >
        <Text style={styles.fabIcon}>{createLoading ? '…' : '+'}</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.base }]}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={updateLoading}>
              <Text style={[styles.modalSave, updateLoading && styles.modalSaveDisabled]}>
                {updateLoading ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              maxLength={60}
            />

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell people about yourself…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={300}
            />
            <Text style={styles.charCount}>{editBio.length}/300</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxxl,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  avatar: {
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 13,
    color: Colors.background,
    fontWeight: Typography.weight.bold,
  },
  displayName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  hostStatus: {
    fontSize: Typography.size.sm,
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  bio: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.55,
    maxWidth: 300,
  },
  bioPlaceholder: {
    fontSize: Typography.size.base,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  statValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  editBtn: {
    flex: 1,
  },
  signOutBtn: {
    flex: 1,
  },
  // Photo wall
  wallSection: {
    paddingTop: Spacing.base,
  },
  wallHeader: {
    paddingHorizontal: Spacing.base,
  },
  emptyWall: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    maxWidth: 220,
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
  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.background,
    lineHeight: 32,
    fontWeight: Typography.weight.regular,
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  modalCancel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  modalSave: {
    fontSize: Typography.size.base,
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalBody: {
    padding: Spacing.base,
  },
  fieldLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.base,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  charCount: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xxs,
  },
})
