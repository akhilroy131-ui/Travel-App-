import React, { useState, useRef } from 'react'
import {
  View,
  FlatList,
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExperiencePhoto } from '../types/models'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface PhotoGalleryProps {
  photos: ExperiencePhoto[]
  initialIndex?: number
  mode?: 'carousel' | 'modal'
  onClose?: () => void
}

export function PhotoGallery({ photos, initialIndex = 0, mode = 'carousel', onClose }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalIndex, setModalIndex] = useState(initialIndex)
  const flatListRef = useRef<FlatList>(null)
  const modalFlatListRef = useRef<FlatList>(null)
  const insets = useSafeAreaInsets()

  if (!photos || photos.length === 0) {
    return <View style={styles.placeholder} />
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveIndex(index)
  }

  const handleModalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setModalIndex(index)
  }

  const openModal = (index: number) => {
    setModalIndex(index)
    setModalVisible(true)
    // scroll modal to correct position after open
    setTimeout(() => {
      modalFlatListRef.current?.scrollToIndex({ index, animated: false })
    }, 50)
  }

  if (mode === 'modal') {
    // Standalone full-screen modal (rendered by parent already inside a Modal)
    return (
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={styles.modalImage}
              contentFit="contain"
            />
          )}
        />
        <PaginationDots total={photos.length} active={activeIndex} style={styles.modalDots} />
      </View>
    )
  }

  // Carousel mode (inline)
  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <TouchableOpacity activeOpacity={0.95} onPress={() => openModal(index)}>
            <Image
              source={{ uri: item.url }}
              style={styles.carouselImage}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
      />
      <PaginationDots total={photos.length} active={activeIndex} style={styles.carouselDots} />

      {/* Full-screen modal when user taps carousel image */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <FlatList
            ref={modalFlatListRef}
            data={photos}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={modalIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onScroll={handleModalScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.modalImage}
                contentFit="contain"
              />
            )}
          />
          <PaginationDots total={photos.length} active={modalIndex} style={styles.modalDots} />
        </View>
      </Modal>
    </View>
  )
}

function PaginationDots({
  total,
  active,
  style,
}: {
  total: number
  active: number
  style?: object
}) {
  if (total <= 1) return null
  return (
    <View style={[styles.dotsRow, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    width: SCREEN_WIDTH,
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceElevated,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 16 / 9,
  },
  carouselDots: {
    marginTop: Spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxs + 2,
  },
  dot: {
    borderRadius: BorderRadius.full,
  },
  dotActive: {
    width: 20,
    height: 6,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: Colors.surfaceBorder,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.base,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalDots: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    left: 0,
    right: 0,
  },
})
