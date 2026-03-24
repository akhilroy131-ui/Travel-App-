import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { AppTabsParamList } from '../../types/navigation'
import { useNearbyExperiences } from '../../hooks/experiences/useNearbyExperiences'
import { MapPin } from '../../components/MapPin'
import { ExperiencePreviewSheet } from '../../components/ExperiencePreviewSheet'
import { ExperiencePin } from '../../types/models'
import { Config } from '../../constants/config'
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme'
import Constants from 'expo-constants'

// Lazy-load Mapbox — native module not available in Expo Go
let MB: typeof import('@rnmapbox/maps').default | null = null
try {
  MB = require('@rnmapbox/maps').default
  const mapboxToken: string = Constants.expoConfig?.extra?.mapboxToken ?? ''
  MB!.setAccessToken(mapboxToken)
} catch {
  // Running in Expo Go — MapScreen will show a placeholder
}

type NavProp = BottomTabNavigationProp<AppTabsParamList, 'Map'>

// Shown in Expo Go where native Mapbox module is unavailable
function MapUnavailable() {
  return (
    <View style={styles.unavailable}>
      <Text style={styles.unavailableEmoji}>🗺️</Text>
      <Text style={styles.unavailableTitle}>Map requires a custom build</Text>
      <Text style={styles.unavailableBody}>
        {'Mapbox is a native module and cannot run in Expo Go.\n\nRun '}
        <Text style={styles.unavailableCode}>npx expo run:android</Text>
        {' or '}
        <Text style={styles.unavailableCode}>npx expo run:ios</Text>
        {' to enable the map.'}
      </Text>
    </View>
  )
}

// Inner component — only rendered when MB is available
function MapScreenContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavProp>()

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [centre, setCentre] = useState({
    lat: Config.MAP_DEFAULT_LAT,
    lng: Config.MAP_DEFAULT_LNG,
  })
  const [radiusKm] = useState(Config.DEFAULT_RADIUS_KM)
  const [selectedPin, setSelectedPin] = useState<ExperiencePin | null>(null)
  const cameraRef = useRef<any>(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError(true)
        return
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const userLat = loc.coords.latitude
        const userLng = loc.coords.longitude
        setUserLocation({ lat: userLat, lng: userLng })
        setCentre({ lat: userLat, lng: userLng })
        cameraRef.current?.setCamera({
          centerCoordinate: [userLng, userLat],
          zoomLevel: Config.MAP_DEFAULT_ZOOM,
          animationDuration: 800,
        })
      } catch {
        setLocationError(true)
      }
    })()
  }, [])

  const { pins, loading: pinsLoading } = useNearbyExperiences({
    lat: centre.lat,
    lng: centre.lng,
    radiusKm,
  })

  const handlePinPress = useCallback((pin: ExperiencePin) => {
    setSelectedPin(pin)
    cameraRef.current?.setCamera({
      centerCoordinate: [pin.location_lng, pin.location_lat],
      zoomLevel: 14,
      animationDuration: 500,
    })
  }, [])

  const handleDismiss = useCallback(() => setSelectedPin(null), [])

  const handleViewDetail = useCallback(
    (experienceId: string) => {
      setSelectedPin(null)
      navigation.navigate('Experiences', {
        screen: 'ExperienceDetail',
        params: { experienceId },
      })
    },
    [navigation]
  )

  const handleRecenter = useCallback(() => {
    if (!userLocation) return
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.lng, userLocation.lat],
      zoomLevel: Config.MAP_DEFAULT_ZOOM,
      animationDuration: 600,
    })
  }, [userLocation])

  const MapView = MB!.MapView
  const Camera = MB!.Camera
  const UserLocation = MB!.UserLocation
  const MarkerView = MB!.MarkerView

  return (
    <View style={styles.screen}>
      <MapView
        style={styles.map}
        styleURL={MB!.StyleURL.Dark}
        onPress={handleDismiss}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassViewPosition={1}
        compassViewMargins={{ x: Spacing.base, y: insets.top + Spacing.sm }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [centre.lng, centre.lat],
            zoomLevel: Config.MAP_DEFAULT_ZOOM,
          }}
        />

        <UserLocation visible renderMode={MB!.UserLocationRenderMode.Native} />

        {pins.map((pin) => (
          <MarkerView
            key={pin.id}
            coordinate={[pin.location_lng, pin.location_lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MapPin
              pin={pin}
              isSelected={selectedPin?.id === pin.id}
              onPress={handlePinPress}
            />
          </MarkerView>
        ))}
      </MapView>

      <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
        {pinsLoading && (
          <View style={styles.loadingBadge}>
            <Text style={styles.loadingBadgeText}>Loading…</Text>
          </View>
        )}
        {locationError && (
          <View style={[styles.loadingBadge, styles.errorBadge]}>
            <Text style={styles.loadingBadgeText}>Location unavailable</Text>
          </View>
        )}
      </View>

      {userLocation && (
        <TouchableOpacity
          style={[styles.recenterBtn, { bottom: selectedPin ? 180 : insets.bottom + Spacing.xl }]}
          onPress={handleRecenter}
          activeOpacity={0.85}
        >
          <Text style={styles.recenterIcon}>◎</Text>
        </TouchableOpacity>
      )}

      <ExperiencePreviewSheet
        experienceId={selectedPin?.id ?? null}
        onViewDetail={handleViewDetail}
        onDismiss={handleDismiss}
      />
    </View>
  )
}

export default function MapScreen() {
  if (!MB) return <MapUnavailable />
  return <MapScreenContent />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  loadingBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  errorBadge: {
    borderColor: Colors.error,
  },
  loadingBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  recenterBtn: {
    position: 'absolute',
    right: Spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recenterIcon: {
    fontSize: 20,
    color: Colors.accent,
  },
  unavailable: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  unavailableEmoji: {
    fontSize: 48,
  },
  unavailableTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  unavailableBody: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.sm * 1.7,
  },
  unavailableCode: {
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
})
