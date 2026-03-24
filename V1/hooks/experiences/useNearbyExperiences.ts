import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ExperiencePin } from '../../types/models'

interface UseNearbyExperiencesOptions {
  lat: number
  lng: number
  radiusKm: number
}

interface UseNearbyExperiencesResult {
  pins: ExperiencePin[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useNearbyExperiences({
  lat,
  lng,
  radiusKm,
}: UseNearbyExperiencesOptions): UseNearbyExperiencesResult {
  const [pins, setPins] = useState<ExperiencePin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // PostGIS radius query via Supabase RPC function
      const { data, error: rpcError } = await supabase.rpc('get_nearby_experiences', {
        ref_lat: lat,
        ref_lng: lng,
        radius_km: radiusKm,
      })

      if (rpcError) throw rpcError

      setPins((data ?? []) as ExperiencePin[])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load nearby experiences')
    } finally {
      setLoading(false)
    }
  }, [lat, lng, radiusKm])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { pins, loading, error, refresh: fetch }
}
