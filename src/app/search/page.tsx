'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { X, CaretDown, CaretUp, MagnifyingGlass, Funnel } from '@phosphor-icons/react/dist/ssr'
import { ArticleCard } from '@/components/ArticleCard'
import { Badge } from '@/components/Badge'
import { crossrefSearch, openalexSearch, parseFieldQuery } from '@/lib/api'
import { ALL_JOURNALS } from '@/lib/data'
import { extractDoi, wordOverlap } from '@/lib/utils'
import type { Article, SearchFacets } from '@/lib/types'

const YEARS = Array.from({ length: 6 }, (_, i) => 2026 - i)

const SEARCH_FIELDS = [
  { value: 'all',     label: 'All Fields' },
  { value: 'title',   label: 'Title' },
  { value: 'author',  label: 'Author' },
  { value: 'doi',     label: 'DOI' },
  { value: 'keyword', label: 'Keyword' },
]
const FIELD_CODE: Record<string, string>  = { title: 'TI', author: 'AU', keyword: 'KW' }
const CODE_TO_FIELD: Record<string, string> = { TI: 'title', AU: 'author', KW: 'keyword', DOI: 'doi', SO: 'journal' }

function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="pb-3 mb-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] mb-2 transition-colors"
        style={{ color: 'var(--posi-text)' }}
      >
        {title}
        {open ? <CaretUp className="h-3 w-3" /> : <CaretDown className="h-3 w-3" />}
      </button>
      {open && children}
    </div>
  )
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const journal = searchParams.get('journal') || ''
  const year = searchParams.get('year') || ''
  const scope = (searchParams.get('scope') || 'all') as 'all' | 'psg'
  const page = Number(searchParams.get('page') || '1')

  const [articles, setArticles] = useState<Article[]>([])
  const [facets, setFacets] = useState<SearchFacets>({
    years: [], journals: [], document_types: [], languages: [], open_access: [],
  })
  const [total, setTotal] = useState(0)
  // Only show loading when we actually have something to search for
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localQuery, setLocalQuery] = useState(q)
  const [searchField, setSearchField] = useState('all')
  const hasSearched = useRef(false)

  // If the query is a DOI or DOI URL, redirect immediately to the DOI lookup page
  useEffect(() => {
    if (!q) return
    const doi = extractDoi(q)
    if (doi) router.replace(`/doi-lookup?doi=${encodeURIComponent(doi)}`)
  }, [q, router])

  // Sync URL query to local state; parse single-field codes like "TI=(value)"
  useEffect(() => {
    const single = q.match(/^([A-Z]{2,3})=\(([^)]*)\)$/)
    if (single) {
      const field = CODE_TO_FIELD[single[1]]
      if (field) { setSearchField(field); setLocalQuery(single[2]); return }
    }
    setSearchField('all')
    setLocalQuery(q)
  }, [q])

  useEffect(() => {
    // Don't fetch if no query and no filters
    if (!q && !journal && scope === 'all') {
      setArticles([])
      setTotal(0)
      setLoading(false)
      return
    }

    hasSearched.current = true
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const issn = journal
      ? (ALL_JOURNALS.find(j => j.journal_code === journal)?.issn_online ?? undefined)
      : undefined
    const searchOpts = {
      page,
      rows: 20,
      yearFrom: year ? Number(year) : undefined,
      yearTo: year ? Number(year) : undefined,
      issn,
      signal: controller.signal,
    }

    const searchPromise = scope === 'psg'
      ? crossrefSearch(q, { ...searchOpts, scope: 'psg' })
      : openalexSearch(q, searchOpts)

    searchPromise.then(({ total: t, items }) => {
      setArticles(items)
      setTotal(t)
      setFacets({
        years: [],
        journals: ALL_JOURNALS.map(j => ({
          value: j.journal_code,
          label: j.short_title,
          count: items.filter(a => a.journal_code === j.journal_code).length,
        })).filter(f => f.count > 0),
        document_types: [],
        languages: [],
        open_access: [],
      })
    }).catch((err: unknown) => {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return
      setArticles([])
      setTotal(0)
      setError('Unable to load search results. The OpenAlex/Crossref API may be temporarily unavailable. Please try again.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })

    return () => controller.abort()
  }, [q, journal, year, scope, page])

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    if (key !== 'page') p.delete('page')
    router.push(`/search?${p.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = localQuery.trim()
    if (!trimmed) return
    const doi = extractDoi(trimmed)
    if (doi || searchField === 'doi') {
      router.push(`/doi-lookup?doi=${encodeURIComponent(doi ?? trimmed)}`)
      return
    }
    const code = FIELD_CODE[searchField]
    updateParam('q', code ? `${code}=(${trimmed})` : trimmed)
  }

  // Detect exact title match: only fires when Title field is selected + query ≥ 6 words
  const isTitleSearch = useMemo(
    () => searchField === 'title' && localQuery.trim().split(/\s+/).length >= 6,
    [searchField, localQuery],
  )
  const bestMatch = useMemo(() => {
    if (!isTitleSearch || articles.length === 0) return null
    const query = localQuery.trim()
    let best: Article | null = null
    let bestScore = 0.68
    for (const a of articles) {
      const score = wordOverlap(query, a.title || '')
      if (score > bestScore) { best = a; bestScore = score }
    }
    return best
  }, [isTitleSearch, articles, localQuery])

  const hasFilters = journal || year
  const pageRows = 20
  const isEmpty = !q && !journal && scope === 'all'
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Search</h1>
        <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
          Search scholarly articles, journals, DOIs, and authors across POSI records and OpenAlex.
        </p>
      </div>

      {/* Inline search bar with field selector */}
      <form onSubmit={handleSearch} className="mb-2 flex gap-0">
        {/* Field selector */}
        <div className="relative shrink-0">
          <select
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            className="appearance-none pl-2 pr-7 py-2.5 h-full focus:outline-none"
            style={{
              border: '1px solid var(--posi-border)',
              borderRight: 'none',
              color: 'var(--posi-text)',
              background: 'var(--posi-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              WebkitAppearance: 'none',
              width: '118px',
            }}
          >
            {SEARCH_FIELDS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--posi-muted)' }} weight="bold" />
        </div>

        {/* Text input */}
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--posi-muted)' }} />
          <input
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder={
              searchField === 'title'   ? 'Enter exact article title…' :
              searchField === 'author'  ? 'Enter author name…' :
              searchField === 'doi'     ? 'Enter DOI or https://doi.org/…' :
              searchField === 'keyword' ? 'Enter keyword…' :
              'Search by title, author, keyword, or DOI…'
            }
            className="w-full pl-9 pr-3 py-2.5 bg-white focus:outline-none"
            style={{ border: '1px solid var(--posi-border)', fontSize: '16px' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0"
          style={{ background: 'var(--posi-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
        >
          Search
        </button>
      </form>

      {/* Advanced search link */}
      <div className="mb-5 flex items-center justify-end gap-4">
        <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
          Need Boolean operators or multiple fields?
        </span>
        <Link
          href="/advanced-search"
          className="text-xs font-semibold hover:underline transition-colors"
          style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
        >
          Advanced Search →
        </Link>
      </div>

      {/* Scope + active badges */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {q && (() => {
            const pf = parseFieldQuery(q)
            const isAdvanced = /[A-Z]{2,3}=\(/.test(q)
            const label = isAdvanced
              ? [pf.title && `Title: ${pf.title}`, pf.author && `Author: ${pf.author}`, pf.freeText && `"${pf.freeText}"`].filter(Boolean).join(' · ') || 'Advanced query'
              : `"${q}"`
            return (
              <span className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>
                Results for <em style={{ color: 'var(--posi-accent)' }}>{label}</em>
                {!loading && <span className="ml-2 text-xs font-mono font-normal" style={{ color: 'var(--posi-muted)' }}>{total.toLocaleString()} records</span>}
              </span>
            )
          })()}
          {!q && !isEmpty && (
            <span className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>
              All Articles
              {!loading && <span className="ml-2 text-xs font-mono font-normal" style={{ color: 'var(--posi-muted)' }}>{total.toLocaleString()} records</span>}
            </span>
          )}
          {journal && <Badge label={`Source: ${journal.toUpperCase()}`} variant="default" />}
          {year && <Badge label={`Year: ${year}`} variant="default" />}
          {hasFilters && (
            <button
              onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
              className="text-[11px] hover:underline flex items-center gap-0.5"
              style={{ color: 'var(--posi-accent)' }}
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
        <div className="flex text-[11px] font-medium" style={{ border: '1px solid var(--posi-border)' }}>
          <button
            onClick={() => updateParam('scope', 'all')}
            className="px-3 py-2 transition-colors"
            style={scope === 'all' ? { background: 'var(--posi-primary)', color: '#fff' } : { background: '#fff', color: 'var(--posi-muted)' }}
          >
            All (OpenAlex)
          </button>
          <button
            onClick={() => updateParam('scope', 'psg')}
            className="px-3 py-2 transition-colors"
            style={{ borderLeft: '1px solid var(--posi-border)', ...(scope === 'psg' ? { background: 'var(--posi-primary)', color: '#fff' } : { background: '#fff', color: 'var(--posi-muted)' }) }}
          >
            PSG (Crossref)
          </button>
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
            {hasFilters && (
              <span className="font-mono text-[10px] px-1" style={{ background: 'var(--posi-accent)', color: '#fff' }}>
                {[journal, year].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Sidebar filters */}
        <aside className={`w-full md:w-44 shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '2px solid var(--posi-accent)' }}>
            <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-text)' }}>Refine</span>
          </div>

          <FilterSection title="Publication Year">
            <div className="space-y-px">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => updateParam('year', year === String(y) ? '' : String(y))}
                  className="w-full text-left text-xs px-2 py-1 transition-colors flex justify-between items-center"
                  style={year === String(y)
                    ? { background: 'var(--posi-accent-light)', color: 'var(--posi-accent)', fontWeight: 600 }
                    : { color: 'var(--posi-muted)' }
                  }
                >
                  <span>{y}</span>
                  {year === String(y) && <X className="h-2.5 w-2.5" />}
                </button>
              ))}
            </div>
          </FilterSection>

          {facets.journals.length > 0 && (
            <FilterSection title="Source Journal">
              <div className="space-y-px">
                {facets.journals.map(j => (
                  <button
                    key={j.value}
                    onClick={() => updateParam('journal', journal === j.value ? '' : j.value)}
                    className="w-full text-left text-[11px] px-2 py-1 transition-colors leading-tight"
                    style={journal === j.value
                      ? { background: 'var(--posi-accent-light)', color: 'var(--posi-accent)', fontWeight: 600 }
                      : { color: 'var(--posi-muted)' }
                    }
                  >
                    <span className="block truncate">{j.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--posi-border)' }}>{j.count} records</span>
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {ALL_JOURNALS.map(j => (
            <div key={j.journal_code} className="hidden" />
          ))}
          <FilterSection title="All Journals" defaultOpen={false}>
            <div className="space-y-px">
              {ALL_JOURNALS.map(j => (
                <button
                  key={j.journal_code}
                  onClick={() => updateParam('journal', journal === j.journal_code ? '' : j.journal_code)}
                  className="w-full text-left text-[11px] px-2 py-1 transition-colors leading-tight"
                  style={journal === j.journal_code
                    ? { background: 'var(--posi-accent-light)', color: 'var(--posi-accent)', fontWeight: 600 }
                    : { color: 'var(--posi-muted)' }
                  }
                >
                  <span className="block truncate">{j.short_title}</span>
                </button>
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Empty state — no search yet */}
          {isEmpty && (
            <div className="bg-white py-16 text-center" style={{ border: '1px solid var(--posi-border)' }}>
              <MagnifyingGlass className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--posi-border)' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>Search POSI records</p>
              <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
                Enter a title, author name, keyword, or DOI above to search 250M+ articles via OpenAlex.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => { setLocalQuery('artificial intelligence'); updateParam('q', 'artificial intelligence') }} className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
                  artificial intelligence
                </button>
                <button onClick={() => { setLocalQuery('climate change'); updateParam('q', 'climate change') }} className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
                  climate change
                </button>
                <button onClick={() => updateParam('scope', 'psg')} className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
                  Browse PSG journals →
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-4 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
                  <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--posi-bg)' }} />
                  <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
                  <div className="h-3 rounded w-full mb-1" style={{ background: 'var(--posi-bg)' }} />
                  <div className="h-3 rounded w-5/6" style={{ background: 'var(--posi-bg)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-white p-6 text-center" style={{ border: '1px solid var(--posi-border)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>Search unavailable</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{error}</p>
            </div>
          )}

          {/* No results */}
          {!loading && !error && !isEmpty && articles.length === 0 && hasSearched.current && (
            <div className="bg-white text-center py-16" style={{ border: '1px solid var(--posi-border)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>No records found</p>
              <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                Try broadening your search, removing filters, or switching to "All (OpenAlex)" scope.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && articles.length > 0 && (
            <>
              {/* Exact-title best-match panel */}
              {bestMatch && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5"
                      style={{ background: 'var(--posi-accent)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                    >
                      Exact Match Found
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                      Highest title similarity to your query
                    </span>
                  </div>
                  <div style={{ border: '2px solid var(--posi-accent)' }}>
                    <ArticleCard article={bestMatch} />
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    {bestMatch.doi && (
                      <Link
                        href={`/doi-lookup?doi=${encodeURIComponent(bestMatch.doi)}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
                      >
                        View full record &amp; cite →
                      </Link>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                      {total.toLocaleString()} related results below
                    </span>
                  </div>
                </div>
              )}

              {bestMatch && (
                <div className="mb-3 pb-1" style={{ borderBottom: '1px solid var(--posi-border)' }}>
                  <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                    All results ({total.toLocaleString()})
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {articles.map((article, idx) => (
                  <div key={article.id} className="flex gap-3">
                    <span className="text-[11px] font-mono mt-3 w-6 shrink-0 text-right" style={{ color: 'var(--posi-border)' }}>
                      {(page - 1) * pageRows + idx + 1}
                    </span>
                    <div
                      className="flex-1 min-w-0"
                      style={bestMatch && bestMatch.id === article.id ? { outline: '2px solid var(--posi-accent)' } : {}}
                    >
                      <ArticleCard article={article} />
                    </div>
                  </div>
                ))}
              </div>

              {total > pageRows && (
                <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--posi-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                    Showing {(page - 1) * pageRows + 1}–{Math.min(page * pageRows, total)} of {total.toLocaleString()}
                  </span>
                  <div className="flex gap-1.5">
                    {page > 1 && (
                      <button
                        onClick={() => updateParam('page', String(page - 1))}
                        className="px-3 py-1.5 text-xs bg-white hover:border-gray-400 transition-colors"
                        style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
                      >
                        ← Previous
                      </button>
                    )}
                    <button
                      onClick={() => updateParam('page', String(page + 1))}
                      className="px-3 py-1.5 text-xs bg-white hover:border-gray-400 transition-colors"
                      style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
                    >
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

// Static fallback — uses native HTML form so it works before JS hydration
function SearchFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Search</h1>
        <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
          Search scholarly articles, journals, DOIs, and authors across POSI records and OpenAlex.
        </p>
      </div>
      {/* Native form — works without JS via GET /search?q=... */}
      <form method="GET" action="/search" className="mb-2 flex gap-0">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--posi-muted)' }} />
          <input
            name="q"
            placeholder="Search by title, author, keyword, or DOI…"
            className="w-full pl-9 pr-3 py-2.5 bg-white focus:outline-none"
            style={{ border: '1px solid var(--posi-border)', fontSize: '16px' }}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--posi-accent)' }}
        >
          Search
        </button>
      </form>
      <div className="mb-5 flex justify-end">
        <a href="/advanced-search" className="text-xs font-semibold" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
          Advanced Search →
        </a>
      </div>
      <div className="bg-white py-16 text-center" style={{ border: '1px solid var(--posi-border)' }}>
        <MagnifyingGlass className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--posi-border)' }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>Search POSI records</p>
        <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
          Enter a title, author name, keyword, or DOI above to search 250M+ articles via OpenAlex.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { label: 'artificial intelligence', href: '/search?q=artificial+intelligence' },
            { label: 'climate change',           href: '/search?q=climate+change' },
            { label: 'Browse PSG journals →',    href: '/search?scope=psg' },
          ].map(chip => (
            <a
              key={chip.href}
              href={chip.href}
              className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
            >
              {chip.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResults />
    </Suspense>
  )
}
