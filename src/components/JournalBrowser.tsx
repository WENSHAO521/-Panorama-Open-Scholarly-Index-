'use client'

import { useState, useCallback, useRef } from 'react'
import { MagnifyingGlass, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { crossrefSearchJournals } from '@/lib/api'
import type { CrossrefJournalItem } from '@/lib/api'

export function JournalBrowser() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CrossrefJournalItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setTotal(0)
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const { total: t, items } = await crossrefSearchJournals(q, { rows: 20 })
      setTotal(t)
      setResults(items)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query)
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-0 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--posi-muted)' }} />
          <input
            value={query}
            onChange={handleChange}
            placeholder="Search journals by title, publisher, or subject…"
            className="w-full pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ border: '1px solid var(--posi-border)', borderRight: 'none', color: 'var(--posi-text)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-semibold text-white shrink-0 transition-colors"
          style={{ background: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-4 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
              <div className="h-4 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
              <div className="h-3 rounded w-1/3" style={{ background: 'var(--posi-bg)' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white p-8 text-center" style={{ border: '1px solid var(--posi-border)' }}>
          <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>No journals found for <em>"{query}"</em></p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2 text-xs" style={{ color: 'var(--posi-muted)' }}>
            <span className="font-mono">
              {total.toLocaleString()} journal{total !== 1 ? 's' : ''} found
              {total > 20 && ' · showing first 20'}
            </span>
            <span>via Crossref</span>
          </div>

          <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            {results.map((j, idx) => {
              const primaryIssn = j.issn[0] ?? null
              const doajUrl = primaryIssn
                ? `https://doaj.org/toc/${primaryIssn.replace('-', '')}`
                : null
              return (
                <div
                  key={idx}
                  className="px-4 py-3 flex items-start justify-between gap-4 transition-colors"
                  style={{ borderBottom: '1px solid var(--posi-border-light)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--posi-bg)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--posi-text)' }}>{j.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
                      <span>{j.publisher}</span>
                      {j.issn.length > 0 && (
                        <span className="font-mono">{j.issn.join(' · ')}</span>
                      )}
                      {j.subjects.length > 0 && (
                        <span className="italic">{j.subjects.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--posi-muted)' }}>
                      {j.total_dois.toLocaleString()} <span style={{ color: 'var(--posi-border)' }}>DOIs</span>
                    </span>
                    {doajUrl && (
                      <a
                        href={doajUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] hover:underline flex items-center gap-0.5 whitespace-nowrap transition-colors"
                        style={{ color: 'var(--posi-accent)' }}
                      >
                        DOAJ <ArrowSquareOut className="h-3 w-3" />
                      </a>
                    )}
                    {primaryIssn && (
                      <a
                        href={`/search?q=${encodeURIComponent(j.title)}&scope=all`}
                        className="text-[11px] whitespace-nowrap transition-colors"
                        style={{ color: 'var(--posi-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-muted)')}
                      >
                        Search articles →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!searched && (
        <div className="p-6 text-center" style={{ border: '1px dashed var(--posi-border)' }}>
          <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
            Search across journal records discovered via Crossref — over 50,000 titles from publishers worldwide.
          </p>
        </div>
      )}
    </div>
  )
}
