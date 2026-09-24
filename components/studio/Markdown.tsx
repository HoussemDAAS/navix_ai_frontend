'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

/** Assistant prose rendered as chat-sized markdown, in the design tokens. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('text-body-2 leading-relaxed text-primary-900 [&>*+*]:mt-2', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <p className="text-subheadline font-bold text-primary-900">{children}</p>,
          h2: ({ children }) => <p className="text-body-1 font-bold text-primary-900">{children}</p>,
          h3: ({ children }) => <p className="text-body-2 font-semibold text-primary-900">{children}</p>,
          h4: ({ children }) => <p className="text-body-2 font-semibold text-primary-900">{children}</p>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="marker:text-alpha-40">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2 hover:text-primary-btn">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded-[6px] bg-alpha-5 px-1 py-0.5 font-mono text-caption-1">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-[10px] bg-alpha-5 p-3 text-caption-1 [&_code]:bg-transparent [&_code]:p-0">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-secondary-400 pl-3 text-alpha-60">{children}</blockquote>
          ),
          hr: () => <hr className="border-alpha-10" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-caption-1">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-alpha-10 px-2 py-1 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-alpha-10 px-2 py-1 align-top">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
