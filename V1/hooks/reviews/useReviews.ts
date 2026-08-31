import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Review } from '../../types/models'
import { Config } from '../../constants/config'

interface UseReviewsResult {
  reviews: Review[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useReviews(experienceId: string | null): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageIndex: number, reset: boolean) => {
    if (!experienceId) {
      setReviews([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select(`
          *,
          author:profiles!author_id (
            id,
            display_name,
            avatar_url,
            is_host,
            bio,
            created_at,
            updated_at
          )
        `)
        .eq('experience_id', experienceId)
        .order('created_at', { ascending: false })
        .range(
          pageIndex * Config.REVIEWS_PAGE_SIZE,
          (pageIndex + 1) * Config.REVIEWS_PAGE_SIZE - 1
        )

      if (queryError) throw queryError

      const results = (data ?? []) as Review[]
      setHasMore(results.length === Config.REVIEWS_PAGE_SIZE)
      setReviews((prev) => (reset ? results : [...prev, ...results]))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [experienceId])

  useEffect(() => {
    setPage(0)
    fetchPage(0, true)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const next = page + 1
      setPage(next)
      fetchPage(next, false)
    }
  }, [loading, hasMore, page, fetchPage])

  const refresh = useCallback(() => {
    setPage(0)
    fetchPage(0, true)
  }, [fetchPage])

  return { reviews, loading, error, hasMore, loadMore, refresh }
}
