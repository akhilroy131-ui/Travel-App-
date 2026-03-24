import { supabase } from './supabase'
import { UserRole } from '../types/models'

// Email + password sign-up
// Pass role and display_name in raw_user_meta_data so the DB trigger can pick them up
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'traveller'
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
      },
    },
  })
}

// Email + password sign-in
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Google OAuth — opens browser flow
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'roam://auth/callback', // deep-link back into the app
    },
  })
}

// Apple Sign-In — requires native module setup (Phase 2)
export async function signInWithApple() {
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'roam://auth/callback',
    },
  })
}

// Sign out
export async function signOut() {
  return supabase.auth.signOut()
}

// Get current session
export async function getSession() {
  return supabase.auth.getSession()
}
