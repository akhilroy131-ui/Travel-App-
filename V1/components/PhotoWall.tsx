import React from 'react'
import { FlatList, View, Dimensions, StyleSheet } from 'react-native'
import { Post } from '../types/models'
import { PhotoWallPost } from './PhotoWallPost'
import { Colors } from '../constants/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GAP = 2

interface PhotoWallProps {
  posts: Post[]
  numColumns?: number
  onPostPress: (post: Post) => void
  onLikePress?: (postId: string) => void
  currentUserId?: string
  ListHeaderComponent?: React.ReactElement
  ListEmptyComponent?: React.ReactElement
}

export function PhotoWall({
  posts,
  numColumns = 3,
  onPostPress,
  onLikePress,
  currentUserId,
  ListHeaderComponent,
  ListEmptyComponent,
}: PhotoWallProps) {
  const tileSize = (SCREEN_WIDTH - GAP * (numColumns - 1)) / numColumns

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      key={`wall-${numColumns}`} // force re-render when numColumns changes
      renderItem={({ item, index }) => {
        const col = index % numColumns
        return (
          <View
            style={{
              marginLeft: col > 0 ? GAP : 0,
              marginBottom: GAP,
            }}
          >
            <PhotoWallPost
              post={item}
              size={tileSize}
              onPress={() => onPostPress(item)}
              onLikePress={onLikePress ? () => onLikePress(item.id) : undefined}
              isLiked={false} // toggled in Phase 7 via useToggleLike
            />
          </View>
        )
      }}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} // parent ScrollView owns scroll
      contentContainerStyle={styles.content}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: Colors.background,
  },
})
