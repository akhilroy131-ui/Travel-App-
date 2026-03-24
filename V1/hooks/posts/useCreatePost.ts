import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadPostPhoto } from '../../lib/storage'

interface CreatePostPayload {
  imageUri: string
  caption?: string
  experienceId?: string | null
  taggedHostId?: string | null
}

interface UseCreatePostResult {
  create: (userId: string, payload: CreatePostPayload) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useCreatePost(): UseCreatePostResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(
    async (userId: string, payload: CreatePostPayload): Promise<boolean> => {
      setLoading(true)
      setError(null)

      try {
        // 1. Upload photo to storage
        const imageUrl = await uploadPostPhoto(userId, payload.imageUri)
        if (!imageUrl) throw new Error('Photo upload failed')

        // 2. Insert post row
        const { error: insertError } = await supabase.from('posts').insert({
          author_id: userId,
          image_url: imageUrl,
          caption: payload.caption ?? null,
          experience_id: payload.experienceId ?? null,
          tagged_host_id: payload.taggedHostId ?? null,
        })

        if (insertError) throw insertError
        return true
      } catch (err: any) {
        setError(err?.message ?? 'Failed to create post')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { create, loading, error }
}
