import { supabase } from './supabase'
import { Config } from '../constants/config'
import * as ImagePicker from 'expo-image-picker'

// Convert a local file URI to a Blob for upload
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return response.blob()
}

// Upload user avatar; returns the public URL on success
export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const ext = uri.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const blob = await uriToBlob(uri)

  const { error } = await supabase.storage
    .from(Config.BUCKET_AVATARS)
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` })

  if (error) {
    console.error('uploadAvatar error:', error)
    return null
  }

  const { data } = supabase.storage.from(Config.BUCKET_AVATARS).getPublicUrl(path)
  return data.publicUrl
}

// Upload one photo for an experience gallery; returns the public URL
export async function uploadExperiencePhoto(
  experienceId: string,
  uri: string
): Promise<string | null> {
  const ext = uri.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `${experienceId}/${filename}`

  const blob = await uriToBlob(uri)

  const { error } = await supabase.storage
    .from(Config.BUCKET_EXPERIENCE_PHOTOS)
    .upload(path, blob, { contentType: `image/${ext}` })

  if (error) {
    console.error('uploadExperiencePhoto error:', error)
    return null
  }

  const { data } = supabase.storage
    .from(Config.BUCKET_EXPERIENCE_PHOTOS)
    .getPublicUrl(path)
  return data.publicUrl
}

// Upload one photo for a user's post wall; returns the public URL
export async function uploadPostPhoto(userId: string, uri: string): Promise<string | null> {
  const ext = uri.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `${userId}/${filename}`

  const blob = await uriToBlob(uri)

  const { error } = await supabase.storage
    .from(Config.BUCKET_POST_PHOTOS)
    .upload(path, blob, { contentType: `image/${ext}` })

  if (error) {
    console.error('uploadPostPhoto error:', error)
    return null
  }

  const { data } = supabase.storage
    .from(Config.BUCKET_POST_PHOTOS)
    .getPublicUrl(path)
  return data.publicUrl
}

// Convenience: launch image picker and return the selected URI
export async function pickImageFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.85,
  })

  if (result.canceled || result.assets.length === 0) return null
  return result.assets[0].uri
}
