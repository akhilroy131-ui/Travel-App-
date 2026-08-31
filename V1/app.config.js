// app.config.js — Dynamic Expo config
// This file reads environment variables and passes them to the app via Constants.expoConfig.extra
// Never hardcode keys here — use .env file (not committed to git)

module.exports = {
  expo: {
    name: 'Roam',
    slug: 'roam',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0D0D0D',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.roam.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.roam.app',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-image',
      "expo-router",
      '@rnmapbox/maps',
      [
        'expo-image-picker',
        {
          photosPermission: 'Roam needs access to your photos to let you post experiences.',
          cameraPermission: 'Roam needs camera access to take photos.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Roam uses your location to show experiences near you.',
        },
      ],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
    },
    scheme: 'roam', // deep link scheme: roam://
  },
}
