'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, CheckCircle, XCircle, Warning, Clock, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { Badge } from '@/components/Badge'
import { CitationFormatter } from '@/components/CitationFormatter'
import { crossrefGetWork, openAlexGetWork } from '@/lib/api'
import { ALL_JOURNALS } from '@/lib/data'
import type { Article, DoiStatus } from '@/lib/types'

const STATUS_CONFIG = {
  verified:   { icon: CheckCircle, color: '#1F7A4D', bg: '#E8F5EE', label: 'Verified',          desc: 'DOI is resolvable and metadata is complete.' },
  registered: { icon: CheckCircle, color: '#374151', bg: '#f5f5f5', label: 'Registered',        desc: 'DOI registered, but metadata may be incomplete.' },
  pending:    { icon: Clock,        color: '#B7791F', bg: '#FFF4DA', label: 'Pending',            desc: 'DOI submitted; awaiting full registration.' },
  not_found:  { icon: XCircle,     color: '#6B7280', bg: '#F6F8FA', label: 'Not Found',          desc: 'DOI not found in external databases.' },
  conflict:   { icon: Warning,     color: '#B7791F', bg: '#FFF4DA', label: 'Metadata Conflict',  desc: 'Metadata inconsistencies detected across sources.' },
  broken:     { icon: XCircle,     color: '#9B1C31', bg: '#FBEAEC', label: 'Broken',             desc: 'DOI cannot be resolved.' },
}

function DoiLookupForm() {
  const router = useRouter()
  const [doi, setDoi] = useState('')
  const lookupCount = useRef(0)

  // Read initial DOI from URL after hydration (avoids useSearchParams / Suspense requirement)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const urlDoi = p.get('doi')
    if (urlDoi) setDoi(urlDoi)
  }, [])
  const [result, setResult] = useState<DoiStatus | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = doi.trim()
    if (!trimmed) return

    const myId = ++lookupCount.current
    setLoading(true)
    setError(null)
    setResult(null)
    setArticle(null)

    try {
      const [cr, oa] = await Promise.all([
        crossrefGetWork(trimmed).catch(() => null),
        openAlexGetWork(trimmed).catch(() => null),
      ])

      if (myId !== lookupCount.current) return

      const crossrefFound = cr !== null
      const openalexFound = oa !== null

      const doiStatus: DoiStatus = {
        doi: trimmed,
        status: crossrefFound && (cr.metadata_quality_score >= 70) ? 'verified'
              : crossrefFound ? 'registered'
              : 'not_found',
        crossref: crossrefFound ? {
          found: true,
          title: cr.title,
          year: cr.publication_year,
          journal: cr.journal_title,
          license: cr.license ?? undefined,
        } : { found: false },
        openalex: openalexFound ? {
          found: true,
          work_id: oa.id.replace('https://openalex.org/', ''),
          cited_by_count: oa.cited_by_count,
          open_access: true,
        } : { found: false },
        citation_visibility: {
          open_citation_count: openalexFound ? oa.cited_by_count : (cr?.cited_by_count ?? 0),
          crossref_references_available: crossrefFound && (cr?.reference_count ?? 0) > 0,
          doi_resolvable: crossrefFound || openalexFound,
        },
        metadata_conflicts: [],
        metadata_quality_score: cr?.metadata_quality_score ?? (crossrefFound ? 55 : 20),
      }
      setResult(doiStatus)
      setArticle(cr)
      router.replace(`/doi-lookup?doi=${encodeURIComponent(trimmed)}`, { scroll: false })
    } catch {
      if (myId !== lookupCount.current) return
      setError('The DOI lookup service is temporarily unavailable. Please try again, or use the Search page to browse POSI records.')
    } finally {
      if (myId === lookupCount.current) setLoading(false)
    }
  }

  const statusConfig = result ? STATUS_CONFIG[result.status] : null

  const relatedJournal = result?.crossref?.journal
    ? ALL_JOURNALS.find(j =>
        j.title.toLowerCase().includes(result.crossref.journal!.toLowerCase().slice(0, 20)) ||
        (result.crossref.journal!.toLowerCase().includes(j.short_title.toLowerCase()))
      )
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>DOI Lookup</h1>
        <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>
          Verify a DOI's registration status, external visibility, and metadata quality across Crossref, OpenAlex, and OpenCitations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>Enter DOI</label>
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
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: 'var(--posi-accent)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Checking…' : 'Lookup'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--posi-muted)' }}>
          Supports any DOI. PSG DOIs use the prefix <span className="font-mono">10.63802</span>.
        </p>
      </form>

      {error && (
        <div className="p-5" style={{ background: '#FBEAEC', border: '1px solid #F5C2CB' }}>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#9B1C31' }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#9B1C31' }}>Lookup Failed</p>
              <p className="text-xs leading-relaxed" style={{ color: '#7f1d1d' }}>{error}</p>
              <div className="flex gap-3 mt-3">
                <a href="/search" className="text-xs underline" style={{ color: '#9B1C31' }}>Search POSI records →</a>
                <a href="/journals" className="text-xs underline" style={{ color: '#9B1C31' }}>Browse journal records →</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && statusConfig && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div className="p-5" style={{ background: statusConfig.bg, border: '1px solid var(--posi-border)' }}>
            <div className="flex items-start gap-3">
              <statusConfig.icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: statusConfig.color }} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold" style={{ color: 'var(--posi-text)' }}>DOI Status: {statusConfig.label}</h2>
                </div>
                <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>{statusConfig.desc}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--posi-muted)' }}>{result.doi}</p>
              </div>
            </div>
          </div>

          {/* Crossref */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--posi-text)' }}>
              Crossref
              <Badge label={result.crossref.found ? 'Found' : 'Not Found'} variant={result.crossref.found ? 'verified' : 'not_found'} />
            </h3>
            {result.crossref.found ? (
              <div className="space-y-1.5 text-sm">
                {result.crossref.title && (
                  <div className="flex gap-2">
                    <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Title</span>
                    <span style={{ color: 'var(--posi-text)' }}>{result.crossref.title}</span>
                  </div>
                )}
                {result.crossref.year && (
                  <div className="flex gap-2">
                    <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Year</span>
                    <span style={{ color: 'var(--posi-text)' }}>{result.crossref.year}</span>
                  </div>
                )}
                {result.crossref.journal && (
                  <div className="flex gap-2">
                    <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Journal</span>
                    <span style={{ color: 'var(--posi-text)' }}>{result.crossref.journal}</span>
                  </div>
                )}
                {result.crossref.license && (
                  <div className="flex gap-2">
                    <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>License</span>
                    <Badge label={result.crossref.license} variant="license" />
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href={`https://doi.org/${result.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline flex items-center gap-1 transition-colors"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    Resolve DOI <ArrowSquareOut className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>No Crossref record found for this DOI.</p>
            )}
          </div>

          {/* OpenAlex */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--posi-text)' }}>
              OpenAlex
              <Badge label={result.openalex.found ? 'Matched' : 'Not Matched'} variant={result.openalex.found ? 'verified' : 'not_found'} />
            </h3>
            {result.openalex.found ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Open Citations</span>
                  <span className="font-semibold" style={{ color: 'var(--posi-text)' }}>{result.openalex.cited_by_count}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Open Access</span>
                  <span style={{ color: result.openalex.open_access ? '#1F7A4D' : 'var(--posi-muted)' }}>
                    {result.openalex.open_access ? '✓ Yes' : 'No'}
                  </span>
                </div>
                {result.openalex.work_id && (
                  <div className="pt-2">
                    <a
                      href={`https://openalex.org/works/${result.openalex.work_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--posi-accent)' }}
                    >
                      View on OpenAlex <ArrowSquareOut className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>This DOI has not been matched in OpenAlex yet.</p>
            )}
          </div>

          {/* Citation Visibility */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--posi-text)' }}>Citation Visibility</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Open Citations', value: result.citation_visibility.open_citation_count },
                { label: 'Crossref Refs', value: result.citation_visibility.crossref_references_available ? 'Available' : 'Unavailable' },
                { label: 'DOI Resolvable', value: result.citation_visibility.doi_resolvable ? 'Yes' : 'No' },
              ].map(item => (
                <div key={item.label} className="text-center p-3" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border-light)' }}>
                  <p className="text-lg font-bold font-mono" style={{ color: 'var(--posi-primary)' }}>{item.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--posi-muted)' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related POSI Journal Record */}
          {relatedJournal && (
            <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--posi-text)' }}>
                Related POSI Journal Record
                <Badge label="POSI Verified" variant="verified" />
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>Journal</span>
                  <span style={{ color: 'var(--posi-text)' }}>{relatedJournal.title}</span>
                </div>
                {relatedJournal.issn_online && (
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>eISSN</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--posi-text)' }}>{relatedJournal.issn_online}</span>
                  </div>
                )}
                {(relatedJournal.pqf ?? relatedJournal.auto_pqf) && (
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 text-xs" style={{ color: 'var(--posi-muted)' }}>PQF Grade</span>
                    <span className="font-mono font-bold text-xs" style={{ color: 'var(--posi-accent)' }}>
                      {(relatedJournal.pqf ?? relatedJournal.auto_pqf)!.grade}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href={`/journal/${relatedJournal.journal_code}`}
                    className="text-xs hover:underline flex items-center gap-1"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    View POSI Journal Record <ArrowSquareOut className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Quality */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>Metadata Quality Score</h3>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--posi-primary)' }}>
                {result.metadata_quality_score}/100
              </span>
            </div>
            <div className="w-full h-2 mb-3" style={{ background: 'var(--posi-bg)' }}>
              <div
                className="h-2 transition-all"
                style={{ width: `${result.metadata_quality_score}%`, background: 'var(--posi-accent)' }}
              />
            </div>
            {result.metadata_conflicts.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-1" style={{ color: '#B7791F' }}>Metadata Issues:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5" style={{ color: '#B7791F' }}>
                  {result.metadata_conflicts.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Citation Generator */}
          {article && (
            <div>
              <div className="mb-2 flex items-baseline gap-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>Citation Generator</h3>
                <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>Copy a formatted citation for this work.</p>
              </div>
              <CitationFormatter article={article} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DoiLookupPage() {
  return <DoiLookupForm />
}
