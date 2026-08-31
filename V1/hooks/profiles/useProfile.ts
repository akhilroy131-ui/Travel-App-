import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Profile } from '../../types/models'

interface UseProfileResult {
  profile: Profile | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useProfile(userId: string | null): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (queryError) throw queryError
      setProfile((data ?? null) as Profile | null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { profile, loading, error, refresh: fetch }
}
