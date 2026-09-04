'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  getAnalysis,
  getCompetitors,
  getJobStatus,
  runAnalysis,
  type AnalysisBrief,
  type Competitor,
} from '@/lib/api'

type AnalysisResult = AnalysisBrief

type PageState = 'loading' | 'empty' | 'running' | 'complete' | 'error'

export default function AnalysisPage() {
  const params = useParams()
  const projectId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [jobProgress, setJobProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // Load existing analysis
  useEffect(() => {
    async function load() {
      try {
        const [analysisRes, compRes] = await Promise.all([
          getAnalysis(projectId).catch(() => ({ data: null })),
          getCompetitors(projectId).catch(() => ({ data: [] as Competitor[] })),
        ])
        setCompetitors(compRes.data || [])
        if (analysisRes.data) {
          setAnalysis(analysisRes.data)
          setPageState('complete')
        } else {
          setPageState('empty')
        }
      } catch {
        setPageState('empty')
      }
    }
    load()
  }, [projectId])

  // Poll job status
  const pollJob = useCallback(async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus<AnalysisResult>(jobId)
        setJobProgress(status.progress)

        if (status.status === 'completed') {
          clearInterval(interval)
          // Prefer the persisted brief; the job output is the same result
          const fresh = await getAnalysis(projectId).catch(() => ({ data: null }))
          const result = fresh.data ?? status.output
          if (result) {
            setAnalysis(result)
            setPageState('complete')
          } else {
            setErrorMsg('The analysis finished but no brief was saved')
            setPageState('error')
          }
        } else if (status.status === 'failed') {
          clearInterval(interval)
          setErrorMsg(status.error || 'Analysis failed')
          setPageState('error')
        }
      } catch {
        clearInterval(interval)
        setErrorMsg('Lost connection to server')
        setPageState('error')
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [projectId])

  const handleRunAnalysis = async () => {
    setPageState('running')
    setJobProgress(0)
    setErrorMsg('')

    try {
      const { data } = await runAnalysis(projectId)
      pollJob(data.jobId)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start')
      setPageState('error')
    }
  }

  if (pageState === 'loading') {
    return (
      <DashboardShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[960px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-h4 sm:text-h3 font-bold text-primary-900 mb-2">
            Market Analysis
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-[520px]">
            AI-powered insights from your competitors&apos; content. Discover what works, what doesn&apos;t, and where your opportunity is.
          </p>
        </motion.div>

        {/* ─── EMPTY STATE: Run Analysis ─── */}
        {pageState === 'empty' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="rounded-[24px] border border-alpha-10 bg-gradient-to-br from-white to-alpha-5/50 p-8 sm:p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-[18px] bg-info-50 flex items-center justify-center mb-5">
                <BarChart3 className="size-8 text-info-500" />
              </div>
              <h2 className="text-h6 font-bold text-primary-900 mb-2">
                Ready to analyze your market
              </h2>
              <p className="text-body-2 text-alpha-60 max-w-[400px] mx-auto mb-2">
                Navix will study your {competitors.length} tracked competitor{competitors.length !== 1 ? 's' : ''} and their content to find patterns, winning hooks, and untapped opportunities.
              </p>
              <p className="text-caption-1 text-alpha-40 mb-8">
                Takes about 30-60 seconds
              </p>

              <button
                onClick={handleRunAnalysis}
                className="inline-flex items-center gap-2.5 rounded-[14px] px-7 py-3.5 text-body-2 font-semibold bg-secondary-300 text-primary-900 border border-primary-900 shadow-signature hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] transition-all duration-200"
              >
                <Sparkles className="size-4" />
                Run Market Analysis
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── RUNNING STATE ─── */}
        {pageState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-8 sm:p-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mx-auto h-14 w-14 rounded-full border-3 border-secondary-300 border-t-transparent mb-6"
            />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">
              Analyzing your market...
            </h2>
            <p className="text-body-2 text-alpha-60 mb-4">
              Studying competitor content patterns, hooks, and engagement
            </p>

            {/* Progress steps */}
            <div className="flex flex-col items-start max-w-[300px] mx-auto gap-3 mt-6 text-left">
              {[
                { label: 'Scanning content formats', threshold: 0 },
                { label: 'Analyzing hooks & CTAs', threshold: 33 },
                { label: 'Finding opportunities', threshold: 66 },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center transition-colors',
                    jobProgress > step.threshold ? 'bg-success-100' : 'bg-alpha-10'
                  )}>
                    {jobProgress > step.threshold ? (
                      <CheckCircle2 className="size-3.5 text-success-600" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-alpha-30" />
                    )}
                  </div>
                  <span className={cn(
                    'text-caption-1 font-medium',
                    jobProgress > step.threshold ? 'text-primary-900' : 'text-alpha-40'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── ERROR STATE ─── */}
        {pageState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-destructive-200 bg-destructive-50/50 p-8 sm:p-10 text-center"
          >
            <AlertCircle className="size-10 text-destructive-500 mx-auto mb-4" />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">Analysis failed</h2>
            <p className="text-body-2 text-alpha-60 mb-6">{errorMsg}</p>
            <button
              onClick={handleRunAnalysis}
              className="inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-body-2 font-medium bg-white text-primary-900 border border-alpha-10 hover:border-alpha-20 shadow-sm transition-all"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ─── RESULTS ─── */}
        {pageState === 'complete' && analysis && (
          <div className="space-y-6">
            {/* Key Takeaways island */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="rounded-[20px] bg-gradient-to-br from-secondary-50 to-white border border-secondary-200 p-6 sm:p-7"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-7 w-7 rounded-full bg-secondary-300 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-primary-900" />
                </div>
                <h2 className="text-subheadline font-bold text-primary-900">Key Takeaways</h2>
              </div>
              <ul className="space-y-2.5">
                {analysis.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-secondary-300/30 flex items-center justify-center mt-0.5">
                      <span className="text-caption-2 font-bold text-primary-900">{i + 1}</span>
                    </div>
                    <span className="text-body-2 text-primary-900">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Dominant Formats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.5 }}
              className="rounded-[20px] border border-alpha-10 bg-white p-6 sm:p-7 shadow-card"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 rounded-[10px] bg-info-50 flex items-center justify-center">
                  <Play className="size-4 text-info-500" />
                </div>
                <div>
                  <h2 className="text-subheadline font-bold text-primary-900">Dominant Formats</h2>
                  <p className="text-caption-2 text-alpha-50">What content types are winning</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.dominant_formats.map((f, i) => (
                  <div key={i} className="rounded-[14px] border border-alpha-10 bg-alpha-5/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-caption-1 font-semibold text-primary-900">{f.format}</span>
                      <span className="text-caption-2 font-medium text-info-500">{f.avg_engagement}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="size-3 text-alpha-40" />
                      <span className="text-caption-2 text-alpha-50">{f.frequency}</span>
                    </div>
                    {f.examples.length > 0 && (
                      <p className="text-caption-2 text-alpha-40 italic truncate">
                        &quot;{f.examples[0]}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Winning Hooks */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-[20px] border border-alpha-10 bg-white p-6 sm:p-7 shadow-card"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 rounded-[10px] bg-success-50 flex items-center justify-center">
                  <TrendingUp className="size-4 text-success-600" />
                </div>
                <div>
                  <h2 className="text-subheadline font-bold text-primary-900">Winning Hooks</h2>
                  <p className="text-caption-2 text-alpha-50">Opening lines that grab attention</p>
                </div>
              </div>

              <div className="space-y-3">
                {analysis.winning_hooks.map((h, i) => (
                  <div key={i} className="rounded-[14px] border border-alpha-10 bg-alpha-5/50 p-4">
                    <p className="text-body-2 font-medium text-primary-900 mb-2">&quot;{h.hook_text}&quot;</p>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-alpha-10 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                        {h.pattern}
                      </span>
                      <span className={cn(
                        'text-caption-2 font-medium',
                        h.effectiveness === 'High' && 'text-success-600',
                        h.effectiveness === 'Medium' && 'text-warning-500',
                        h.effectiveness === 'Low' && 'text-alpha-40',
                      )}>
                        {h.effectiveness} effectiveness
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Whitespace Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5 }}
              className="rounded-[20px] border border-alpha-10 bg-white p-6 sm:p-7 shadow-card"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 rounded-[10px] bg-secondary-50 flex items-center justify-center">
                  <Lightbulb className="size-4 text-secondary-600" />
                </div>
                <div>
                  <h2 className="text-subheadline font-bold text-primary-900">Whitespace Opportunities</h2>
                  <p className="text-caption-2 text-alpha-50">Gaps your competitors aren&apos;t filling</p>
                </div>
              </div>

              <div className="space-y-3">
                {analysis.whitespace_opportunities.map((o, i) => (
                  <div key={i} className="rounded-[14px] border border-secondary-200 bg-secondary-50/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-caption-1 font-semibold text-primary-900">{o.area}</span>
                      <span className="text-caption-2 font-medium text-secondary-600">
                        {Math.round(o.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-caption-1 text-alpha-60">{o.reasoning}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Cadence + Re-run */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-alpha-40" />
                <div>
                  <p className="text-caption-1 font-medium text-primary-900">Content Cadence</p>
                  <p className="text-caption-2 text-alpha-50">{analysis.content_cadence}</p>
                </div>
              </div>
              <button
                onClick={handleRunAnalysis}
                className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-caption-1 font-medium bg-alpha-5 text-primary-900 border border-alpha-10 hover:bg-alpha-10 transition-all"
              >
                <RefreshCw className="size-3.5" />
                Re-run Analysis
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
