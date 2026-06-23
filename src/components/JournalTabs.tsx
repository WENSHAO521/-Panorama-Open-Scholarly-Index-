'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from './Badge'
import { MetadataQualityBar } from './MetadataQualityBar'
import { JournalBrowser } from './JournalBrowser'
import { ArticleCountBadge } from './ArticleCountBadge'
import type { Journal } from '@/lib/types'
import type { CrossrefJournalMeta } from '@/lib/api'

const INDEXING_VARIANT = {
  A: 'indexing-a' as const,
  B: 'indexing-b' as const,
  C: 'indexing-c' as const,
  D: 'indexing-d' as const,
  'Internal Review': 'default' as const,
}

const DOAJ_VARIANT: Record<string, 'doaj-listed' | 'doaj-pending' | 'doaj-not'> = {
  listed: 'doaj-listed',
  application_submitted: 'doaj-pending',
  not_listed: 'doaj-not',
}

interface JournalWithCr {
  journal: Journal
  cr: CrossrefJournalMeta | null
  issnCountry?: string | null
  oaiCount?: number
}

function JournalTable({ rows, showOjqf }: { rows: JournalWithCr[]; showOjqf?: boolean }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>ISSN</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Articles</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>MQS</th>
                {showOjqf && <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PQF</th>}
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>IRS</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>DOAJ</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ journal, cr, issnCountry, oaiCount }) => {
                const officialScore = journal.pqf ?? journal.ojqf
                const pqfScore = officialScore ?? journal.auto_pqf ?? null
                const ojqfGrade = pqfScore?.grade
                const isAutoPqf = !officialScore && !!journal.auto_pqf
                return (
                  <tr
                    key={journal.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid var(--posi-border-light)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div>
                          {journal.id.startsWith('j-disc-') ? (
                            <a
                              href={journal.website_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]"
                              style={{ color: 'var(--posi-text)' }}
                            >
                              {journal.title}
                            </a>
                          ) : (
                            <Link
                              href={`/journal/${journal.journal_code}`}
                              className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]"
                              style={{ color: 'var(--posi-text)' }}
                            >
                              {journal.title}
                            </Link>
                          )}
                          <span className="font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{journal.short_title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--posi-muted)' }}>
                      {journal.issn_print && <div><span className="text-[9px] uppercase tracking-wide mr-1">p</span>{journal.issn_print}</div>}
                      {journal.issn_online && <div><span className="text-[9px] uppercase tracking-wide mr-1">e</span>{journal.issn_online}</div>}
                      {!journal.issn_print && !journal.issn_online && '—'}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--posi-muted)' }}>{journal.publisher}</td>
                    <td className="px-3 py-3 text-center font-mono font-medium">
                      <ArticleCountBadge issn={journal.issn_online ?? null} fallback={oaiCount && oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)} />
                    </td>
                    <td className="px-3 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>{journal.metadata_quality_score}</td>
                    {showOjqf && (
                      <td className="px-3 py-3 text-center">
                        {ojqfGrade ? (
                          <span
                            className="font-mono font-bold text-xs"
                            title={isAutoPqf ? 'Auto-assessed PQF (pending POSI review)' : undefined}
                            style={{
                              color: isAutoPqf ? '#B45309'
                                   : ojqfGrade === 'A+' || ojqfGrade === 'A' ? '#1F7A4D'
                                   : ojqfGrade === 'B+' || ojqfGrade === 'B' ? 'var(--posi-primary)'
                                   : ojqfGrade === 'C' ? '#B7791F'
                                   : 'var(--posi-muted)'
                            }}
                          >
                            {ojqfGrade}{isAutoPqf ? '*' : ''}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="px-3 py-3 text-center">
                      <Badge
                        label={journal.indexing_readiness}
                        variant={INDEXING_VARIANT[journal.indexing_readiness] || 'default'}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {journal.doaj_status ? (
                        <Badge
                          label={journal.doaj_status.replace('_', ' ')}
                          variant={DOAJ_VARIANT[journal.doaj_status] ?? 'default'}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--posi-muted)' }}>{journal.registration_country || issnCountry || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid sm:grid-cols-2 gap-3">
        {rows.map(({ journal, cr, oaiCount }) => {
          const isDisc = journal.id.startsWith('j-disc-')
          const CardEl = isDisc ? 'a' : Link
          const cardProps = isDisc
            ? { href: journal.website_url || '#', target: '_blank', rel: 'noopener noreferrer' }
            : { href: `/journal/${journal.journal_code}` }
          return (
            <CardEl
              key={journal.id}
              {...(cardProps as any)}
              className="bg-white p-4 flex flex-col group transition-colors"
              style={{ border: '1px solid var(--posi-border)' }}
            >
              <div className="mb-3">
                <h2 className="text-xs font-semibold leading-snug" style={{ color: 'var(--posi-text)' }}>{journal.title}</h2>
                <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--posi-muted)' }}>{journal.short_title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{journal.publisher}</p>
              </div>

              <div className="space-y-1 text-xs mb-3 flex-1">
                {journal.issn_print && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--posi-muted)' }}>pISSN</span>
                    <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{journal.issn_print}</span>
                  </div>
                )}
                {journal.issn_online && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--posi-muted)' }}>eISSN</span>
                    <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{journal.issn_online}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: 'var(--posi-muted)' }}>Articles</span>
                  <ArticleCountBadge issn={journal.issn_online ?? null} fallback={oaiCount && oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)} />
                </div>
                {showOjqf && (journal.pqf ?? journal.ojqf ?? journal.auto_pqf) && (() => {
                  const score = journal.pqf ?? journal.ojqf ?? journal.auto_pqf
                  const auto = !(journal.pqf ?? journal.ojqf) && !!journal.auto_pqf
                  return (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--posi-muted)' }}>PQF{auto ? '*' : ''}</span>
                      <span className="font-mono font-bold" style={{ color: auto ? '#B45309' : 'var(--posi-accent)' }}>
                        {score!.total} · {score!.grade}
                      </span>
                    </div>
                  )
                })()}
              </div>

              <MetadataQualityBar score={journal.metadata_quality_score} />

              <div className="flex flex-wrap gap-1 mt-2">
                <Badge label="OA" variant="oa" />
                {journal.doaj_status && (
                  <Badge
                    label={`DOAJ: ${journal.doaj_status.replace('_', ' ')}`}
                    variant={DOAJ_VARIANT[journal.doaj_status] ?? 'default'}
                  />
                )}
              </div>
            </CardEl>
          )
        })}
      </div>
    </>
  )
}

const PER_PAGE = 20

function Pagination({ page, totalPages, tab }: { page: number; totalPages: number; tab: string }) {
  if (totalPages <= 1) return null
  const prev = page > 1 ? `?tab=${tab}&page=${page - 1}` : null
  const next = page < totalPages ? `?tab=${tab}&page=${page + 1}` : null
  return (
    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--posi-border)' }}>
      <div>
        {prev ? (
          <Link href={prev} className="px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
            ← Prev
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--posi-muted)', border: '1px solid var(--posi-border)', opacity: 0.4 }}>← Prev</span>
        )}
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
        Page {page} / {totalPages}
      </span>
      <div>
        {next ? (
          <Link href={next} className="px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100" style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
            Next →
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs" style={{ color: 'var(--posi-muted)', border: '1px solid var(--posi-border)', opacity: 0.4 }}>Next →</span>
        )}
      </div>
    </div>
  )
}

type TabId = 'psg' | 'indexed' | 'crossref' | 'discovered'

interface Props {
  psgRows: JournalWithCr[]
  indexedRows: JournalWithCr[]
  discoveredRows: JournalWithCr[]
}

export function JournalTabs({ psgRows, indexedRows, discoveredRows }: Props) {
  const searchParams = useSearchParams()

  const activeTab = (searchParams.get('tab') ?? 'psg') as TabId
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const psgArticles = psgRows.reduce((s, { oaiCount, cr, journal }) => s + (oaiCount && oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)), 0)

  // Indexed tab pagination
  const indexedTotalPages = Math.max(1, Math.ceil(indexedRows.length / PER_PAGE))
  const indexedPage = Math.min(currentPage, indexedTotalPages)
  const pagedIndexed = indexedRows.slice((indexedPage - 1) * PER_PAGE, indexedPage * PER_PAGE)

  // Discovered tab pagination
  const discoveredTotalPages = Math.max(1, Math.ceil(discoveredRows.length / PER_PAGE))
  const discoveredPage = Math.min(currentPage, discoveredTotalPages)
  const pagedDiscovered = discoveredRows.slice((discoveredPage - 1) * PER_PAGE, discoveredPage * PER_PAGE)

  const verifiedTabs: { id: TabId; label: string; count: string }[] = [
    { id: 'psg',      label: 'PSG Collection',   count: `${psgRows.length} journals` },
    { id: 'indexed',  label: 'Verified Records',  count: `${indexedRows.length.toLocaleString()} journals` },
    { id: 'crossref', label: 'Crossref Journals', count: '50,000+' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex overflow-x-auto scrollbar-none">
          {verifiedTabs.map(tab => (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}`}
              className="px-4 py-2.5 text-xs font-medium -mb-px transition-colors whitespace-nowrap shrink-0"
              style={{
                color: activeTab === tab.id ? 'var(--posi-primary)' : 'var(--posi-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--posi-primary)' : '2px solid transparent',
              }}
            >
              {tab.label}
              <span
                className="ml-1.5 font-mono text-[10px]"
                style={{ color: activeTab === tab.id ? 'var(--posi-muted)' : 'var(--posi-border)' }}
              >
                {tab.count}
              </span>
            </Link>
          ))}
          {/* Auto-discovered tab — visually separated */}
          <div className="flex items-center mx-2 shrink-0" style={{ borderLeft: '1px solid var(--posi-border)' }} />
          <Link
            href="?tab=discovered"
            className="px-4 py-2.5 text-xs font-medium -mb-px transition-colors whitespace-nowrap shrink-0"
            style={{
              color: activeTab === 'discovered' ? '#92400E' : 'var(--posi-muted)',
              borderBottom: activeTab === 'discovered' ? '2px solid #F59E0B' : '2px solid transparent',
            }}
          >
            Auto-discovered Records
            <span
              className="ml-1.5 font-mono text-[10px]"
              style={{ color: activeTab === 'discovered' ? '#B45309' : 'var(--posi-border)' }}
            >
              {discoveredRows.length.toLocaleString()} unverified
            </span>
          </Link>
        </div>
      </div>

      {/* PSG Collection */}
      {activeTab === 'psg' && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              Journals published by Panorama Scholarly Group.
            </p>
            <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {psgArticles.toLocaleString()} articles
            </span>
          </div>
          <JournalTable rows={psgRows} showOjqf />
        </div>
      )}

      {/* Verified Records */}
      {activeTab === 'indexed' && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              Third-party open access journals with verified POSI records.
            </p>
            <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              Showing {((indexedPage - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(indexedPage * PER_PAGE, indexedRows.length).toLocaleString()} of {indexedRows.length.toLocaleString()}
            </span>
          </div>
          <JournalTable rows={pagedIndexed} showOjqf />
          <Pagination page={indexedPage} totalPages={indexedTotalPages} tab="indexed" />
        </div>
      )}

      {/* Crossref Journals */}
      {activeTab === 'crossref' && (
        <div>
          <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
            Search 50,000+ journals across all publishers indexed in Crossref.
          </p>
          <JournalBrowser />
        </div>
      )}

      {/* Auto-discovered Records */}
      {activeTab === 'discovered' && (
        <div>
          <div
            className="flex items-start gap-2.5 px-3.5 py-2.5 mb-4 text-xs leading-relaxed"
            style={{ background: '#FFFBEB', border: '1px solid #F59E0B', color: '#78350F' }}
          >
            <span className="font-bold shrink-0 mt-px">!</span>
            <span>
              These records are <strong>pending manual verification</strong> by the POSI team and may contain inaccuracies.
              DOAJ-confirmed journals are automatically promoted to Verified Records.
              PQF* grades are auto-assessed from DOAJ/OpenAlex signals and have not been manually reviewed.
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              Showing {((discoveredPage - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(discoveredPage * PER_PAGE, discoveredRows.length).toLocaleString()} of {discoveredRows.length.toLocaleString()} journals
            </span>
          </div>
          <JournalTable rows={pagedDiscovered} showOjqf />
          <Pagination page={discoveredPage} totalPages={discoveredTotalPages} tab="discovered" />
        </div>
      )}
    </div>
  )
}
