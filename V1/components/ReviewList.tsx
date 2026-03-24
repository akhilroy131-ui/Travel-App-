import React from 'react'
import { FlatList, View, StyleSheet } from 'react-native'
import { Review } from '../types/models'
import { ReviewItem } from './ReviewItem'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { Divider } from './ui/Divider'
import { Colors, Spacing } from '../constants/theme'

interface ReviewListProps {
  reviews: Review[]
  loading?: boolean
  ListHeaderComponent?: React.ReactElement
}

export function ReviewList({ reviews, loading, ListHeaderComponent }: ReviewListProps) {
  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <View style={styles.itemWrap}>
          <ReviewItem review={item} />
          {index < reviews.length - 1 && <Divider />}
        </View>
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={loading ? <LoadingSpinner size="small" style={styles.spinner} /> : null}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} // scroll is handled by parent ScrollView / FlatList
    />
  )
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: Colors.background,
  },
  itemWrap: {
    paddingHorizontal: Spacing.base,
  },
  spinner: {
    flex: 0,
    paddingVertical: Spacing.lg,
  },
})
