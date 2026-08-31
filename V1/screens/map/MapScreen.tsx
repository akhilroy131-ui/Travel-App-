import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import { useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { AppTabsParamList } from '../../types/navigation'
import { useNearbyExperiences } from '../../hooks/experiences/useNearbyExperiences'
import { MapPin } from '../../components/MapPin'
import { ExperiencePreviewSheet } from '../../components/ExperiencePreviewSheet'
import { ExperiencePin } from '../../types/models'
import { Config } from '../../constants/config'
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme'

const mapboxToken = String(Constants.expoConfig?.extra?.mapboxToken ?? '').trim()

// Expo Go does not contain Mapbox's native module. Builds without a public
// token must also stay usable instead of taking down the React surface.
let Mapbox: typeof import('@rnmapbox/maps').default | null = null
if (mapboxToken) {
  try {
    Mapbox = require('@rnmapbox/maps').default
    Mapbox?.setAccessToken(mapboxToken)
  } catch {
    Mapbox = null
  }
}

type NavProp = BottomTabNavigationProp<AppTabsParamList, 'Map'>

function MapUnavailable({ missingToken }: { missingToken: boolean }) {
  return (
    <View style={styles.unavailable}>
      <Text style={styles.unavailableEmoji}>🗺️</Text>
      <Text style={styles.unavailableTitle}>Map setup required</Text>
      <Text style={styles.unavailableBody}>
        {missingToken
          ? 'Add EXPO_PUBLIC_MAPBOX_TOKEN to .env, then rebuild the app to enable Mapbox.'
          : 'Mapbox needs the native Roam build. Rebuild Android to enable the map.'}
      </Text>
    </View>
  )
}

function MapScreenContent() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavProp>()
  const cameraRef = useRef<any>(null)

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [centre, setCentre] = useState({
    lat: Config.MAP_DEFAULT_LAT,
    lng: Config.MAP_DEFAULT_LNG,
  })
  const [radiusKm] = useState(Config.DEFAULT_RADIUS_KM)
  const [selectedPin, setSelectedPin] = useState<ExperiencePin | null>(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError(true)
        return
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        const lat = location.coords.latitude
        const lng = location.coords.longitude

        setUserLocation({ lat, lng })
        setCentre({ lat, lng })
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
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

  const MapView = Mapbox!.MapView
  const Camera = Mapbox!.Camera
  const LocationPuck = Mapbox!.LocationPuck
  const MarkerView = Mapbox!.MarkerView

  return (
    <View style={styles.screen}>
      <MapView
        style={styles.map}
        styleURL={Mapbox!.StyleURL.Dark}
        surfaceView={false}
        onPress={handleDismiss}
        compassEnabled
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [centre.lng, centre.lat],
            zoomLevel: Config.MAP_DEFAULT_ZOOM,
          }}
        />

        <LocationPuck visible />

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
  if (!mapboxToken) return <MapUnavailable missingToken />
  if (!Mapbox) return <MapUnavailable missingToken={false} />
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
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  unavailableBody: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.7,
    textAlign: 'center',
  },
})
