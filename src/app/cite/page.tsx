'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, XCircle, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { CitationFormatter } from '@/components/CitationFormatter'
import { crossrefGetWork, openAlexGetArticle } from '@/lib/api'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'

type Source = 'crossref' | 'openalex'

function CitePage() {
  const router = useRouter()
  const [doi, setDoi] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const lookupCount = useRef(0)
  const [source, setSource] = useState<Source>('crossref')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const urlDoi = p.get('doi')
    if (urlDoi) {
      setDoi(urlDoi)
      doLookup(urlDoi)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function doLookup(doiStr: string) {
    const trimmed = doiStr.trim()
    if (!trimmed) return
    const myId = ++lookupCount.current
    setLoading(true)
    setError(null)
    setArticle(null)

    try {
      // Try Crossref and OpenAlex in parallel
      const [cr, oa] = await Promise.all([
        crossrefGetWork(trimmed).catch(() => null),
        openAlexGetArticle(trimmed).catch(() => null),
      ])

      if (myId !== lookupCount.current) return

      let result: Article | null = null
      let src: Source = 'crossref'

      if (cr) {
        // Crossref is primary — enrich with OpenAlex data where missing
        result = { ...cr }
        if (oa) {
          if (!result.abstract && oa.abstract)   result = { ...result, abstract: oa.abstract }
          if (result.keywords.length === 0 && oa.keywords.length > 0) result = { ...result, keywords: oa.keywords }
          if (oa.cited_by_count > result.cited_by_count) result = { ...result, cited_by_count: oa.cited_by_count }
          if (oa.openalex_work_id) result = { ...result, openalex_work_id: oa.openalex_work_id }
        }
        src = 'crossref'
      } else if (oa) {
        // Crossref not found — use OpenAlex
        result = oa
        src = 'openalex'
      }

      if (!result) {
        setError('No article metadata found for this DOI in Crossref or OpenAlex.')
        return
      }

      setArticle(result)
      setSource(src)
      router.replace(`/cite?doi=${encodeURIComponent(trimmed)}`, { scroll: false })
    } catch {
      if (myId !== lookupCount.current) return
      setError('Lookup failed. Verify the DOI format and try again.')
    } finally {
      if (myId === lookupCount.current) setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    doLookup(doi)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Citation Generator</h1>
        <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>
          Enter a DOI to generate a formatted citation. Metadata retrieved from Crossref and OpenAlex.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>
          Enter DOI
        </label>
        <div className="flex gap-3">
          <input
            value={doi}
            onChange={e => setDoi(e.target.value)}
            placeholder="e.g. 10.63802/afs.2024.008"
            className="flex-1 px-4 py-2.5 focus:outline-none transition-colors"
            style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', fontSize: '16px' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />
          <button
            type="submit"
            disabled={loading || !doi.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: 'var(--posi-accent)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--posi-muted)' }}>
          PSG DOIs use prefix <span className="font-mono">10.63802</span>. Any Crossref or OpenAlex DOI is supported.
        </p>
      </form>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-6 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="h-4 rounded w-3/4 mb-3" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/3" style={{ background: 'var(--posi-bg)' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5" style={{ background: '#FBEAEC', border: '1px solid #F5C2CB' }}>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#9B1C31' }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#9B1C31' }}>Not Found</p>
              <p className="text-xs" style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && article && (
        <div className="space-y-4">
          {/* Article summary */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <p
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              >
                Article Found
              </p>
              <span
                className="text-[9px] px-1.5 py-0.5 uppercase tracking-[0.1em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: source === 'openalex' ? '#E8F5EE' : '#f5f5f5',
                  color: source === 'openalex' ? '#1F7A4D' : '#666',
                  border: `1px solid ${source === 'openalex' ? '#bbdece' : '#ddd'}`,
                }}
              >
                via {source === 'openalex' ? 'OpenAlex' : 'Crossref'}
              </span>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--posi-text)' }}>
              {decodeHtml(article.title)}
            </h2>
            {article.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>
                {article.authors.slice(0, 5).map(a => a.display_name).join('; ')}
                {article.authors.length > 5 && (
                  <span style={{ color: 'var(--posi-soft)' }}> +{article.authors.length - 5} more</span>
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {article.journal_title && <span>{decodeHtml(article.journal_title)}</span>}
              {article.volume && <span>Vol. {article.volume}</span>}
              {article.issue && <span>No. {article.issue}</span>}
              <span>{article.publication_year}</span>
            </div>
            {article.doi && (
              <div className="mt-3">
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  {article.doi} <ArrowSquareOut className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Citation formatter */}
          <CitationFormatter article={article} />
        </div>
      )}
    </div>
  )
}

export default function CiteGeneratorPage() {
  return <CitePage />
}
