'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen } from '@phosphor-icons/react/dist/ssr'
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
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Frequency</th>
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
                        {journal.cover_image_url ? (
                          <img
                            src={journal.cover_image_url}
                            alt={`${journal.short_title} cover`}
                            className="w-7 shrink-0 object-cover"
                            style={{ aspectRatio: '2/3', border: '1px solid var(--posi-border-light)' }}
                          />
                        ) : (
                          <div className="w-7 shrink-0 flex items-center justify-center" style={{ aspectRatio: '2/3', background: 'var(--posi-bg)' }}>
                            <BookOpen className="h-3 w-3" style={{ color: 'var(--posi-border)' }} />
                          </div>
                        )}
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
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--posi-muted)' }}>{journal.registration_country ?? issnCountry ?? '—'}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>{journal.frequency}</td>
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
              <div className="flex items-start gap-3 mb-3">
                {journal.cover_image_url ? (
                  <img
                    src={journal.cover_image_url}
                    alt={`${journal.short_title} cover`}
                    className="w-10 shrink-0 object-cover"
                    style={{ aspectRatio: '2/3', border: '1px solid var(--posi-border-light)' }}
                  />
                ) : (
                  <div className="w-10 shrink-0 flex items-center justify-center" style={{ aspectRatio: '2/3', background: 'var(--posi-soft-blue)' }}>
                    <BookOpen className="h-4 w-4" style={{ color: 'var(--posi-muted)' }} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold leading-snug" style={{ color: 'var(--posi-text)' }}>{journal.title}</h2>
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--posi-muted)' }}>{journal.short_title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{journal.publisher}</p>
                </div>
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


type TabId = 'psg' | 'indexed' | 'crossref' | 'discovered'

interface Props {
  psgRows: JournalWithCr[]
  indexedRows: JournalWithCr[]
  discoveredRows: JournalWithCr[]
}

export function JournalTabs({ psgRows, indexedRows, discoveredRows }: Props) {
  const [active, setActive] = useState<TabId>('psg')

  const psgArticles = psgRows.reduce((s, { oaiCount, cr, journal }) => s + (oaiCount && oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)), 0)
  const indexedArticles = indexedRows.reduce((s, { oaiCount, cr, journal }) => s + (oaiCount && oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)), 0)

  const verifiedTabs: { id: TabId; label: string; count: string }[] = [
    { id: 'psg',        label: 'PSG Collection',   count: `${psgRows.length} journals` },
    { id: 'indexed',    label: 'Verified Records',  count: `${indexedRows.length} journals` },
    { id: 'crossref',   label: 'Crossref Journals', count: '50,000+' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex overflow-x-auto scrollbar-none">
          {verifiedTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="px-4 py-2.5 text-xs font-medium -mb-px transition-colors whitespace-nowrap shrink-0"
              style={{
                color: active === tab.id ? 'var(--posi-primary)' : 'var(--posi-muted)',
                borderBottom: active === tab.id ? '2px solid var(--posi-primary)' : '2px solid transparent',
              }}
            >
              {tab.label}
              <span
                className="ml-1.5 font-mono text-[10px]"
                style={{ color: active === tab.id ? 'var(--posi-muted)' : 'var(--posi-border)' }}
              >
                {tab.count}
              </span>
            </button>
          ))}
          {/* Extended tab — visually separated */}
          <div className="flex items-center mx-2 shrink-0" style={{ borderLeft: '1px solid var(--posi-border)' }} />
          <button
            onClick={() => setActive('discovered')}
            className="px-4 py-2.5 text-xs font-medium -mb-px transition-colors whitespace-nowrap shrink-0"
            style={{
              color: active === 'discovered' ? '#92400E' : 'var(--posi-muted)',
              borderBottom: active === 'discovered' ? '2px solid #F59E0B' : '2px solid transparent',
            }}
          >
            Extended Records
            <span
              className="ml-1.5 font-mono text-[10px]"
              style={{ color: active === 'discovered' ? '#B45309' : 'var(--posi-border)' }}
            >
              {discoveredRows.length} unverified
            </span>
          </button>
        </div>
      </div>

      {/* PSG Collection */}
      {active === 'psg' && (
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
      {active === 'indexed' && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              Third-party open access journals with verified POSI records.
            </p>
            <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {indexedArticles.toLocaleString()} articles
            </span>
          </div>
          <JournalTable rows={indexedRows} showOjqf />
        </div>
      )}

      {/* Crossref Journals */}
      {active === 'crossref' && (
        <div>
          <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
            Search 50,000+ journals across all publishers indexed in Crossref.
          </p>
          <JournalBrowser />
        </div>
      )}

      {/* Extended Records */}
      {active === 'discovered' && (
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
          <JournalTable rows={discoveredRows} showOjqf />
        </div>
      )}
    </div>
  )
}
