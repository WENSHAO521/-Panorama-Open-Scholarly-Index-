'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Funnel, X } from '@phosphor-icons/react/dist/ssr'
import { ArticleCard } from '@/components/ArticleCard'
import { crossrefSearch } from '@/lib/api'
import { ALL_JOURNALS } from '@/lib/data'
import type { Article } from '@/lib/types'

const YEARS = Array.from({ length: 6 }, (_, i) => 2026 - i)

function ArticleResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const journal = searchParams.get('journal') || ''
  const year = searchParams.get('year') || ''
  const page = Number(searchParams.get('page') || '1')

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    crossrefSearch('', {
      page,
      rows: 20,
      scope: 'psg',
      yearFrom: year ? Number(year) : undefined,
      yearTo: year ? Number(year) : undefined,
      issn: journal ? (ALL_JOURNALS.find(j => j.journal_code === journal)?.issn_online ?? undefined) : undefined,
    }).then(({ total: t, items }) => {
      setArticles(items)
      setTotal(t)
    }).catch(() => {
      setError('Unable to load article records. Please try again.')
    }).finally(() => setLoading(false))
  }, [journal, year, page])

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    if (key !== 'page') p.delete('page')
    router.push(`/articles?${p.toString()}`)
  }

  const pageRows = 20

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--posi-text)' }}>Article Metadata Records</h1>
            <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
              Article metadata records in POSI support journal-level verification, DOI coverage checks,
              metadata quality assessment, and citation visibility analysis.
            </p>
          </div>
          {!loading && (
            <p className="text-xs font-mono shrink-0" style={{ color: 'var(--posi-muted)' }}>
              {total.toLocaleString()} records
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile filter toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-colors"
            style={{
              border: '1px solid var(--posi-border)',
              color: filtersOpen ? 'var(--posi-accent)' : 'var(--posi-muted)',
              background: filtersOpen ? 'var(--posi-accent-light)' : '#fff',
            }}
          >
            <Funnel className="h-3.5 w-3.5" />
            Filters
            {(journal || year) && (
              <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'var(--posi-accent)', color: '#fff' }}>
                {[journal, year].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <aside className={`w-full md:w-48 shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="pb-2 mb-3" style={{ borderBottom: '2px solid var(--posi-accent)' }}>
            <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-text)' }}>Filter</span>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--posi-muted)' }}>Publication Year</p>
            <div className="space-y-px">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => updateParam('year', year === String(y) ? '' : String(y))}
                  className="w-full text-left text-xs px-2 py-1 transition-colors flex justify-between"
                  style={year === String(y) ? { background: 'var(--posi-accent-light)', color: 'var(--posi-accent)', fontWeight: 600 } : { color: 'var(--posi-muted)' }}
                >
                  <span>{y}</span>
                  {year === String(y) && <X className="h-2.5 w-2.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--posi-muted)' }}>Journal</p>
            <div className="space-y-px">
              {ALL_JOURNALS.map(j => (
                <button
                  key={j.journal_code}
                  onClick={() => updateParam('journal', journal === j.journal_code ? '' : j.journal_code)}
                  className="w-full text-left text-[11px] px-2 py-1 transition-colors"
                  style={journal === j.journal_code ? { background: 'var(--posi-accent-light)', color: 'var(--posi-accent)', fontWeight: 600 } : { color: 'var(--posi-muted)' }}
                >
                  <span className="block truncate">{j.short_title}</span>
                </button>
              ))}
            </div>
          </div>

          {(journal || year) && (
            <button
              onClick={() => router.push('/articles')}
              className="w-full text-xs px-3 py-1.5 mt-1 flex items-center justify-center gap-1 transition-colors"
              style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white p-4 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
                  <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--posi-bg)' }} />
                  <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
                  <div className="h-3 rounded w-full" style={{ background: 'var(--posi-bg)' }} />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white p-8 text-center" style={{ border: '1px solid var(--posi-border)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>Unable to load articles</p>
              <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>{error}</p>
              <p className="text-xs mt-3" style={{ color: 'var(--posi-muted)' }}>
                Try browsing individual journals directly:{' '}
                <Link href="/journals" className="underline" style={{ color: 'var(--posi-accent)' }}>Journal list →</Link>
              </p>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className="bg-white p-8 text-center" style={{ border: '1px solid var(--posi-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--posi-muted)' }}>No articles found for current filters</p>
            </div>
          )}

          {!loading && !error && articles.length > 0 && (
            <>
              <div className="space-y-2.5">
                {articles.map((article, idx) => (
                  <div key={article.id} className="flex gap-3">
                    <span className="text-[11px] font-mono mt-3 w-6 shrink-0 text-right" style={{ color: 'var(--posi-border)' }}>
                      {(page - 1) * pageRows + idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <ArticleCard article={article} />
                    </div>
                  </div>
                ))}
              </div>

              {total > pageRows && (
                <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--posi-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                    Page {page} · {total.toLocaleString()} total records
                  </span>
                  <div className="flex gap-1.5">
                    {page > 1 && (
                      <button onClick={() => updateParam('page', String(page - 1))} className="px-3 py-1.5 text-xs bg-white" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
                        ← Previous
                      </button>
                    )}
                    <button onClick={() => updateParam('page', String(page + 1))} className="px-3 py-1.5 text-xs bg-white" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ArticlesFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--posi-text)' }}>Article Metadata Records</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--posi-muted)' }}>Article metadata records supporting journal-level verification and metadata quality assessment.</p>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white p-4 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="h-4 rounded w-3/4 mb-2" style={{ background: '#e5e5e5' }} />
            <div className="h-3 rounded w-1/2 mb-2" style={{ background: '#e5e5e5' }} />
            <div className="h-3 rounded w-full" style={{ background: '#e5e5e5' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<ArticlesFallback />}>
      <ArticleResults />
    </Suspense>
  )
}
