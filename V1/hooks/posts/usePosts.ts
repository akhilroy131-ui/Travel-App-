import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Post } from '../../types/models'
import { Config } from '../../constants/config'

interface UsePostsOptions {
  authorId?: string | null
  taggedHostId?: string | null
}

interface UsePostsResult {
  posts: Post[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function usePosts({ authorId, taggedHostId }: UsePostsOptions): UsePostsResult {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageIndex: number, reset: boolean) => {
    // Need at least one filter
    if (!authorId && !taggedHostId) {
      setPosts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!author_id (
            id,
            display_name,
            avatar_url,
            role,
            bio,
            created_at,
            updated_at
          ),
          tagged_host:profiles!tagged_host_id (
            id,
            display_name,
            avatar_url,
            role,
            bio,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(
          pageIndex * Config.POSTS_PAGE_SIZE,
          (pageIndex + 1) * Config.POSTS_PAGE_SIZE - 1
        )

      if (authorId) {
        query = query.eq('author_id', authorId)
      } else if (taggedHostId) {
        query = query.eq('tagged_host_id', taggedHostId)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      const results = (data ?? []) as Post[]
      setHasMore(results.length === Config.POSTS_PAGE_SIZE)
      setPosts((prev) => (reset ? results : [...prev, ...results]))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [authorId, taggedHostId])

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

  return { posts, loading, error, hasMore, loadMore, refresh }
}
