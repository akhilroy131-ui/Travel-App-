import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapboxGL from '@rnmapbox/maps'
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

// Initialise Mapbox with the public access token
const mapboxToken: string =
  Constants.expoConfig?.extra?.mapboxToken ?? ''
MapboxGL.setAccessToken(mapboxToken)

type NavProp = BottomTabNavigationProp<AppTabsParamList, 'Map'>

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavProp>()

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)

  // Map centre — defaults to NYC until user location is obtained
  const [centre, setCentre] = useState({
    lat: Config.MAP_DEFAULT_LAT,
    lng: Config.MAP_DEFAULT_LNG,
  })
  const [radiusKm, setRadiusKm] = useState(Config.DEFAULT_RADIUS_KM)

  const [selectedPin, setSelectedPin] = useState<ExperiencePin | null>(null)
  const cameraRef = useRef<MapboxGL.Camera>(null)

  // Request location permission on mount
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

  const { pins, loading: pinsLoading, refresh: refreshPins } = useNearbyExperiences({
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

  const handleDismiss = useCallback(() => {
    setSelectedPin(null)
  }, [])

  const handleViewDetail = useCallback(
    (experienceId: string) => {
      setSelectedPin(null)
      // Cross-tab deep link: switch to Experiences tab and push ExperienceDetail
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

  return (
    <View style={styles.screen}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Dark}
        onPress={handleDismiss}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassViewPosition={1} // top-right
        compassViewMargins={{ x: Spacing.base, y: insets.top + Spacing.sm }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [centre.lng, centre.lat],
            zoomLevel: Config.MAP_DEFAULT_ZOOM,
          }}
        />

        {/* User location puck */}
        <MapboxGL.UserLocation visible renderMode={MapboxGL.UserLocationRenderMode.Native} />

        {/* Experience pins */}
        {pins.map((pin) => (
          <MapboxGL.MarkerView
            key={pin.id}
            coordinate={[pin.location_lng, pin.location_lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MapPin
              pin={pin}
              isSelected={selectedPin?.id === pin.id}
              onPress={handlePinPress}
            />
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      {/* Top controls */}
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

      {/* Recenter button */}
      {userLocation && (
        <TouchableOpacity
          style={[styles.recenterBtn, { bottom: selectedPin ? 180 : insets.bottom + Spacing.xl }]}
          onPress={handleRecenter}
          activeOpacity={0.85}
        >
          <Text style={styles.recenterIcon}>◎</Text>
        </TouchableOpacity>
      )}

      {/* Preview sheet — slides up when a pin is selected */}
      <ExperiencePreviewSheet
        experienceId={selectedPin?.id ?? null}
        onViewDetail={handleViewDetail}
        onDismiss={handleDismiss}
      />
    </View>
  )
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
})
