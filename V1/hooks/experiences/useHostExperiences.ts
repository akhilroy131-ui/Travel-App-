import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Experience } from '../../types/models'

interface UseHostExperiencesResult {
  experiences: Experience[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useHostExperiences(hostId: string | null): UseHostExperiencesResult {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!hostId) {
      setExperiences([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('experiences')
        .select('*')
        .eq('host_id', hostId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setExperiences((data ?? []) as Experience[])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load host experiences')
    } finally {
      setLoading(false)
    }
  }, [hostId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { experiences, loading, error, refresh: fetch }
}
