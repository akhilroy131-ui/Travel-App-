import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface UseToggleLikeResult {
  toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>
  loading: boolean
}

export function useToggleLike(userId: string | null): UseToggleLikeResult {
  const [loading, setLoading] = useState(false)

  const toggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      if (!userId || loading) return

      setLoading(true)
      try {
        if (currentlyLiked) {
          await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
        } else {
          await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId })
        }
      } catch (err) {
        console.error('toggleLike error:', err)
      } finally {
        setLoading(false)
      }
    },
    [userId, loading]
  )

  return { toggleLike, loading }
}
