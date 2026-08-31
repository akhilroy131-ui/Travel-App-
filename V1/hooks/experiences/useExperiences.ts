import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Experience, ExperienceCategory } from '../../types/models'
import { Config } from '../../constants/config'

interface UseExperiencesOptions {
  category?: ExperienceCategory | null
  minRating?: number | null
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'newest'
}

interface UseExperiencesResult {
  experiences: Experience[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useExperiences(options: UseExperiencesOptions = {}): UseExperiencesResult {
  const { category, minRating, sortBy = 'newest' } = options

  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageIndex: number, reset: boolean) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
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
          )
        `)
        .eq('is_published', true)
        .range(
          pageIndex * Config.EXPERIENCES_PAGE_SIZE,
          (pageIndex + 1) * Config.EXPERIENCES_PAGE_SIZE - 1
        )

      if (category) {
        query = query.eq('category', category)
      }

      if (minRating != null) {
        query = query.gte('avg_rating', minRating)
      }

      switch (sortBy) {
        case 'rating':
          query = query.order('avg_rating', { ascending: false })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      const results = (data ?? []) as Experience[]
      setHasMore(results.length === Config.EXPERIENCES_PAGE_SIZE)
      setExperiences((prev) => (reset ? results : [...prev, ...results]))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load experiences')
    } finally {
      setLoading(false)
    }
  }, [category, minRating, sortBy])

  // Reset and refetch when filters change
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

  return { experiences, loading, error, hasMore, loadMore, refresh }
}
