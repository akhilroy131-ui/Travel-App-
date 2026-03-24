import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExperienceStackParamList } from '../../types/navigation'
import { useProfile } from '../../hooks/profiles/useProfile'
import { useHostExperiences } from '../../hooks/experiences/useHostExperiences'
import { usePosts } from '../../hooks/posts/usePosts'
import { Avatar } from '../../components/ui/Avatar'
import { Divider } from '../../components/ui/Divider'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ExperienceCard } from '../../components/ExperienceCard'
import { PhotoWall } from '../../components/PhotoWall'
import { Post } from '../../types/models'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

type Props = NativeStackScreenProps<ExperienceStackParamList, 'HostLanding'>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function HostLandingScreen({ route, navigation }: Props) {
  const { hostId } = route.params
  const insets = useSafeAreaInsets()

  const { profile, loading: profileLoading, error: profileError, refresh: refreshProfile } = useProfile(hostId)
  const { experiences, loading: expLoading } = useHostExperiences(hostId)
  const { posts, loading: postsLoading, loadMore: loadMorePosts } = usePosts({ taggedHostId: hostId })

  const handleExperiencePress = useCallback(
    (id: string) => {
      navigation.navigate('ExperienceDetail', { experienceId: id })
    },
    [navigation]
  )

  const handlePostPress = useCallback((post: Post) => {
    // Phase 7: open post detail / full-screen view
    Alert.alert(post.caption ?? 'Photo', 'Full post view coming in Phase 7.')
  }, [])

  if (profileLoading) return <LoadingSpinner label="Loading host…" />
  if (profileError || !profile) {
    return <ErrorMessage message={profileError ?? 'Host not found'} onRetry={refreshProfile} />
  }

  const PhotoWallHeader = (
    <View style={styles.wallHeader}>
      <SectionHeader title="Photo Wall" />
    </View>
  )

  const PhotoWallEmpty = (
    <View style={styles.emptyWall}>
      <Text style={styles.emptyWallText}>No photos tagged yet.</Text>
    </View>
  )

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <View style={styles.hero}>
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + Spacing.sm }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        {/* Large avatar */}
        <Avatar
          uri={profile.avatar_url}
          size={88}
          fallbackInitials={profile.display_name}
          style={styles.avatar}
        />

        {/* Host name */}
        <Text style={styles.hostName}>{profile.display_name}</Text>
        <Text style={styles.hostRole}>Host on Roam</Text>

        {/* Bio */}
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatPill label="Experiences" value={experiences.length} />
          <View style={styles.statDivider} />
          <StatPill label="Photos" value={posts.length} />
        </View>
      </View>

      <Divider />

      {/* Experiences */}
      <View style={styles.section}>
        <SectionHeader
          title={`Experiences (${experiences.length})`}
          style={styles.sectionHeader}
        />
        {expLoading ? (
          <LoadingSpinner size="small" style={styles.sectionSpinner} />
        ) : experiences.length === 0 ? (
          <Text style={styles.emptyText}>No published experiences yet.</Text>
        ) : (
          experiences.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onPress={handleExperiencePress}
            />
          ))
        )}
      </View>

      <Divider />

      {/* Photo wall */}
      <View style={styles.section}>
        <PhotoWall
          posts={posts}
          onPostPress={handlePostPress}
          ListHeaderComponent={PhotoWallHeader}
          ListEmptyComponent={
            postsLoading ? (
              <LoadingSpinner size="small" style={styles.sectionSpinner} />
            ) : (
              PhotoWallEmpty
            )
          }
        />
        {posts.length > 0 && (
          <TouchableOpacity onPress={loadMorePosts} style={styles.loadMoreBtn}>
            <Text style={styles.loadMoreText}>Load more photos</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.giant,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.base,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
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
  avatar: {
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  hostName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  hostRole: {
    fontSize: Typography.size.sm,
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  bio: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.55,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
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
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.surfaceBorder,
  },
  // Sections
  section: {
    paddingTop: Spacing.base,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.base,
  },
  sectionSpinner: {
    flex: 0,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  // Photo wall
  wallHeader: {
    paddingHorizontal: Spacing.base,
  },
  emptyWall: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyWallText: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
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
})
