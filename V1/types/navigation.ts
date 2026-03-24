import { NavigatorScreenParams } from '@react-navigation/native'

// Auth flow screens
export type AuthStackParamList = {
  Welcome: undefined
  SignIn: undefined
  SignUp: undefined
}

// Screens nested inside the Experiences tab stack
export type ExperienceStackParamList = {
  ExperiencesList: undefined
  ExperienceDetail: { experienceId: string }
  HostLanding: { hostId: string }
}

// Bottom tab navigator screens
export type AppTabsParamList = {
  Map: undefined
  Experiences: NavigatorScreenParams<ExperienceStackParamList>
  Profile: undefined
}

// Root navigator — switches between auth and app
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  App: NavigatorScreenParams<AppTabsParamList>
}
