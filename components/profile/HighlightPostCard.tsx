'use client'

import { useState } from 'react'
import { Heart, MessageCircle, ImageOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { avatarSrc } from '@/lib/avatar'
import type { ProfilePost } from '@/lib/api'
import { fmtCount } from '@/components/profile/utils'

interface HighlightPostCardProps {
  label: string
  Icon: LucideIcon
  post: ProfilePost
}

/** One highlight: a post thumbnail, its two numbers and its first caption line. */
export function HighlightPostCard({ label, Icon, post }: HighlightPostCardProps) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(post.thumbnail_url)

  const body = (
    <article className="flex h-full items-start gap-3 rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card transition-all duration-200 hover:border-alpha-30 hover:-translate-y-0.5">
      <div className="size-16 shrink-0 overflow-hidden rounded-[12px] bg-alpha-5">
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.caption ?? label}
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="size-5 text-alpha-30" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">
          <Icon className="size-3.5" />
          {label}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-body-2 font-bold text-primary-900 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5 text-alpha-40" />
            {fmtCount(post.likes_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5 text-alpha-40" />
            {fmtCount(post.comments_count)}
          </span>
        </div>
        {post.caption ? (
          <p className="mt-1 text-caption-1 text-alpha-60 line-clamp-1">{post.caption}</p>
        ) : (
          <p className="mt-1 text-caption-1 italic text-alpha-40">No caption</p>
        )}
      </div>
    </article>
  )

  if (!post.post_url) return body

  return (
    <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="block h-full">
      {body}
    </a>
  )
}
