import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
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
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme'

type NavProp = BottomTabNavigationProp<AppTabsParamList, 'Map'>

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavProp>()
  const mapRef = useRef<MapView>(null)

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
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const userLat = loc.coords.latitude
        const userLng = loc.coords.longitude
        setUserLocation({ lat: userLat, lng: userLng })
        setCentre({ lat: userLat, lng: userLng })
        mapRef.current?.animateToRegion({
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800)
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
    mapRef.current?.animateToRegion({
      latitude: pin.location_lat,
      longitude: pin.location_lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500)
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
    mapRef.current?.animateToRegion({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 600)
  }, [userLocation])

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: centre.lat,
          longitude: centre.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleDismiss}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.location_lat, longitude: pin.location_lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <MapPin
              pin={pin}
              isSelected={selectedPin?.id === pin.id}
              onPress={handlePinPress}
            />
          </Marker>
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

// Dark map style to match app theme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c54' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d3d6e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]
