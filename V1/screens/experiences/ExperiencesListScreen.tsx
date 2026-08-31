import React, { useState, useCallback } from 'react'
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ExperienceStackParamList } from '../../types/navigation'
import { ExperienceCategory, ExperienceFilters } from '../../types/models'
import { useExperiences } from '../../hooks/experiences/useExperiences'
import { ExperienceCard } from '../../components/ExperienceCard'
import { ExperienceCardSkeleton } from '../../components/ExperienceCardSkeleton'
import { CategoryFilter } from '../../components/CategoryFilter'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme'

type Props = NativeStackScreenProps<ExperienceStackParamList, 'ExperiencesList'>

type SortOption = Exclude<ExperienceFilters['sortBy'], 'distance'>

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

export default function ExperiencesListScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ExperienceCategory | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [sortModalVisible, setSortModalVisible] = useState(false)

  const { experiences, loading, error, hasMore, loadMore, refresh } = useExperiences({
    category: selectedCategory,
    sortBy,
  })

  const handleCardPress = useCallback(
    (id: string) => {
      navigation.navigate('ExperienceDetail', { experienceId: id })
    },
    [navigation]
  )

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'

  const ListHeader = (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Experiences</Text>
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={styles.sortButton}
          activeOpacity={0.75}
        >
          <Text style={styles.sortButtonText}>↕ {currentSortLabel}</Text>
        </TouchableOpacity>
      </View>
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
    </View>
  )

  // Show skeletons on first load (no data yet), empty state only when load is done
  const ListEmpty = loading && experiences.length === 0 ? (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((i) => (
        <ExperienceCardSkeleton key={i} style={styles.card} />
      ))}
    </View>
  ) : !loading ? (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No experiences found</Text>
      <Text style={styles.emptySubtitle}>Try a different category or check back later.</Text>
    </View>
  ) : null

  if (error) {
    return (
      <View style={styles.screen}>
        <ErrorMessage message={error} onRetry={refresh} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={experiences}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExperienceCard experience={item} onPress={handleCardPress} style={styles.card} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={
          loading ? <LoadingSpinner size="small" style={styles.footerSpinner} /> : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        onRefresh={refresh}
        refreshing={loading && experiences.length === 0}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sort bottom sheet modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortSheetTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setSortBy(opt.value)
                  setSortModalVisible(false)
                }}
                style={[styles.sortOption, opt.value === sortBy && styles.sortOptionActive]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    opt.value === sortBy && styles.sortOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.value === sortBy && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
  },
  sortButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xxs + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sortButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  card: {
    marginHorizontal: Spacing.base,
  },
  skeletonList: {
    paddingTop: Spacing.xs,
  },
  footerSpinner: {
    flex: 0,
    paddingVertical: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.giant,
    paddingHorizontal: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayHeavy,
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    ...Shadow.lg,
  },
  sortHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sortSheetTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  sortOptionActive: {
    backgroundColor: Colors.surface,
  },
  sortOptionText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  sortOptionTextActive: {
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  checkmark: {
    fontSize: Typography.size.base,
    color: Colors.accent,
    fontWeight: Typography.weight.bold,
  },
})
