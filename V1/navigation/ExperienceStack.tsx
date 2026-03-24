import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ExperienceStackParamList } from '../types/navigation'
import { Colors, Typography } from '../constants/theme'
import ExperiencesListScreen from '../screens/experiences/ExperiencesListScreen'
import ExperienceDetailScreen from '../screens/experiences/ExperienceDetailScreen'
import HostLandingScreen from '../screens/host/HostLandingScreen'

const Stack = createNativeStackNavigator<ExperienceStackParamList>()

export default function ExperienceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: Typography.weight.bold,
          color: Colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="ExperiencesList"
        component={ExperiencesListScreen}
        options={{ title: 'Experiences', headerShown: false }}
      />
      <Stack.Screen
        name="ExperienceDetail"
        component={ExperienceDetailScreen}
        options={{ title: '', headerTransparent: true }}
      />
      <Stack.Screen
        name="HostLanding"
        component={HostLandingScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
