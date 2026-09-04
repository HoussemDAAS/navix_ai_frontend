'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ProfilePost } from '@/lib/api'
import { PostCard } from '@/components/profile/PostCard'

type SortMode = 'recent' | 'top'

const SORT_LABELS: Record<SortMode, string> = { recent: 'Recent', top: 'Top' }

function engagement(post: ProfilePost): number {
  return (post.likes_count ?? 0) + (post.comments_count ?? 0)
}

function publishedAt(post: ProfilePost): number {
  return post.published_at ? new Date(post.published_at).getTime() : 0
}

interface PostsGridProps {
  title: string
  posts: ProfilePost[]
}

export function PostsGrid({ title, posts }: PostsGridProps) {
  const [sort, setSort] = useState<SortMode>('recent')

  const sorted = useMemo(() => {
    const copy = [...posts]
    return sort === 'recent'
      ? copy.sort((a, b) => publishedAt(b) - publishedAt(a))
      : copy.sort((a, b) => engagement(b) - engagement(a))
  }, [posts, sort])

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-subheadline font-semibold text-primary-900">
          {title}{' '}
          <span className="text-alpha-40 tabular-nums">
            ({posts.length} {posts.length === 1 ? 'post' : 'posts'})
          </span>
        </h2>
        <div className="inline-flex items-center rounded-[10px] border border-alpha-10 bg-white p-0.5">
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSort(mode)}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-caption-1 font-medium transition-colors',
                sort === mode
                  ? 'bg-secondary-300 text-primary-900'
                  : 'text-alpha-60 hover:text-primary-900',
              )}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {sorted.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </motion.section>
  )
}
