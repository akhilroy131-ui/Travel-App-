import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Experience } from '../../types/models'

interface UseExperienceResult {
  experience: Experience | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useExperience(experienceId: string | null): UseExperienceResult {
  const [experience, setExperience] = useState<Experience | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!experienceId) {
      setExperience(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('experiences')
        .select(`
          *,
          host:profiles!host_id (
            id,
            display_name,
            avatar_url,
            is_host,
            bio,
            created_at,
            updated_at
          ),
          photos:experience_photos (
            id,
            experience_id,
            url,
            display_order,
            uploaded_by,
            created_at
          )
        `)
        .eq('id', experienceId)
        .single()

      if (queryError) throw queryError

      // Sort photos by display_order
      if (data && data.photos) {
        data.photos = [...data.photos].sort(
          (a: any, b: any) => a.display_order - b.display_order
        )
      }

      setExperience(data as Experience)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load experience')
    } finally {
      setLoading(false)
    }
  }, [experienceId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { experience, loading, error, refresh: fetch }
}
