'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Eye, Film, Video, Layers, Image as ImageIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { avatarSrc } from '@/lib/avatar'
import type { ProfilePost } from '@/lib/api'
import { fmtCount, fmtDate, fmtDuration } from '@/components/profile/utils'

const FORMAT_META: Record<string, { label: string; Icon: LucideIcon }> = {
  reel: { label: 'Reel', Icon: Film },
  short: { label: 'Short', Icon: Film },
  video: { label: 'Video', Icon: Video },
  long_video: { label: 'Video', Icon: Video },
  carousel: { label: 'Carousel', Icon: Layers },
  image: { label: 'Image', Icon: ImageIcon },
}

const FALLBACK_META = { label: 'Post', Icon: Layers }

export function PostCard({ post }: { post: ProfilePost }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(post.thumbnail_url)
  const meta = FORMAT_META[post.content_type ?? ''] ?? FALLBACK_META
  const duration = fmtDuration(post.duration_seconds)
  const { Icon } = meta

  const card = (
    <article className="group h-full overflow-hidden rounded-[16px] border border-alpha-10 bg-white shadow-card transition-all duration-200 hover:border-alpha-30 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="relative aspect-square overflow-hidden bg-alpha-5">
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.caption ?? meta.label}
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="size-7 text-alpha-30" />
          </div>
        )}

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-alpha-80 px-2 py-1 text-caption-2 font-medium text-white backdrop-blur-sm">
          <Icon className="size-3" />
          {meta.label}
          {duration && <span className="tabular-nums">· {duration}</span>}
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-900/80 to-transparent px-2.5 pb-2 pt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption-2 font-medium text-white tabular-nums">
            {post.likes_count != null && (
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                {fmtCount(post.likes_count)}
              </span>
            )}
            {post.comments_count != null && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3" />
                {fmtCount(post.comments_count)}
              </span>
            )}
            {post.views_count != null && post.views_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {fmtCount(post.views_count)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3">
        {post.caption ? (
          <p className="text-caption-1 text-primary-900 line-clamp-2">{post.caption}</p>
        ) : (
          <p className="text-caption-1 text-alpha-40 italic">No caption</p>
        )}
        <p className="mt-1.5 text-caption-2 text-alpha-40">{fmtDate(post.published_at)}</p>
      </div>
    </article>
  )

  if (!post.post_url) return card

  return (
    <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="block h-full">
      {card}
    </a>
  )
}
