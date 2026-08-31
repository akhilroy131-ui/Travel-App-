import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { TablesUpdate } from '../../types/database'

type UpdateProfilePayload = Pick<
  TablesUpdate<'profiles'>,
  'display_name' | 'bio' | 'avatar_url'
>

interface UseUpdateProfileResult {
  update: (userId: string, payload: UpdateProfilePayload) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useUpdateProfile(): UseUpdateProfileResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(async (userId: string, payload: UpdateProfilePayload): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update profile')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { update, loading, error }
}
