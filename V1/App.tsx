import React, { useEffect } from 'react'
import { Linking } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootNavigator from './navigation/RootNavigator'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Colors } from './constants/theme'
import { supabase } from './lib/supabase'

export default function App() {
  useEffect(() => {
    // Handle OAuth deep-link callbacks for both PKCE and implicit flows.
    async function handleUrl({ url }: { url: string }) {
      if (!url.includes('auth/callback')) return

      const query = url.split('?')[1]?.split('#')[0] ?? ''
      const fragment = url.split('#')[1] ?? ''
      const queryParams = new URLSearchParams(query)
      const fragmentParams = new URLSearchParams(fragment)
      const code = queryParams.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        return
      }

      const accessToken = fragmentParams.get('access_token')
      const refreshToken = fragmentParams.get('refresh_token')

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      }
    }

    const sub = Linking.addEventListener('url', handleUrl)

    // Also handle the case where the app was launched via the deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('auth/callback')) {
        void handleUrl({ url })
      }
    })

    return () => sub.remove()
  }, [])

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={Colors.background} />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
