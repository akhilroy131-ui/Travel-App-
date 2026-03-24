import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface SubmitReviewPayload {
  experienceId: string
  rating: number
  body?: string
}

interface UseSubmitReviewResult {
  submit: (payload: SubmitReviewPayload) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useSubmitReview(): UseSubmitReviewResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async ({ experienceId, rating, body }: SubmitReviewPayload): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to leave a review')

      const { error: insertError } = await supabase.from('reviews').upsert(
        {
          experience_id: experienceId,
          author_id: user.id,
          rating,
          body: body?.trim() || null,
          booking_id: null, // v1: no booking gate
        },
        { onConflict: 'experience_id,author_id' }
      )

      if (insertError) throw insertError

      return true
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit review')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}
