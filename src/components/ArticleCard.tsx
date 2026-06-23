'use client'

import Link from 'next/link'
import { ArrowSquareOut, Quotes } from '@phosphor-icons/react/dist/ssr'
import type { Article } from '@/lib/types'
import { Badge } from './Badge'
import { decodeHtml } from '@/lib/utils'

function mqsColor(score: number): string {
  if (score >= 75) return '#1F7A4D'
  if (score >= 60) return '#B7791F'
  if (score >= 40) return '#C05621'
  return '#9B1C31'
}

const CR_STATUS: Record<string, { label: string; variant: 'verified' | 'registered' | 'pending' | 'not_found' | 'conflict' | 'broken' }> = {
  verified:   { label: 'CR Verified',   variant: 'verified'   },
  registered: { label: 'CR Registered', variant: 'registered' },
  pending:    { label: 'CR Pending',    variant: 'pending'    },
  not_found:  { label: 'CR Not Found',  variant: 'not_found'  },
  conflict:   { label: 'CR Conflict',   variant: 'conflict'   },
  broken:     { label: 'CR Broken',     variant: 'broken'     },
}

interface ArticleCardProps {
  article: Article
  showAbstract?: boolean
  compact?: boolean
  className?: string
}

export function ArticleCard({ article, showAbstract = true, compact = false, className }: ArticleCardProps) {
  const titleUrl = article.html_url ?? `https://doi.org/${article.doi}`
  const title    = decodeHtml(article.title)
  const crInfo   = article.crossref_status ? CR_STATUS[article.crossref_status] : null

  // ── COMPACT ROW ────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <article
        className={`bg-white px-4 py-3 flex items-center gap-4 group transition-colors ${className ?? ''}`}
        style={{ border: '1px solid var(--posi-border)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--posi-accent-light)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
      >
        <div className="flex-1 min-w-0">
          <a
            href={titleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[13.5px] font-semibold truncate hover:underline"
            style={{ color: 'var(--posi-text)' }}
          >
            {title}
          </a>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
            {article.authors.slice(0, 2).map((a, i) => (
              <span key={a.id}>
                {i > 0 && ' · '}
                {a.family_name && a.given_name
                  ? `${a.family_name}, ${a.given_name.charAt(0)}.`
                  : a.display_name}
              </span>
            ))}
            {article.authors.length > 2 && <span> +{article.authors.length - 2}</span>}
            {article.journal_title && <span> · {decodeHtml(article.journal_title)}</span>}
            <span> · {article.publication_year}</span>
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-4">
          {/* MQS score */}
          <div className="text-right" style={{ minWidth: '2.5rem' }}>
            <span
              className="block font-bold font-mono leading-tight"
              style={{ color: mqsColor(article.metadata_quality_score), fontSize: '15px' }}
            >
              {article.metadata_quality_score}
            </span>
            <span
              className="block uppercase"
              style={{ color: 'var(--posi-soft)', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.12em' }}
            >
              MQS
            </span>
          </div>

          {/* DOI link — visible on hover */}
          {article.doi && (
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] flex items-center gap-0.5 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              title={article.doi}
            >
              DOI <ArrowSquareOut className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </article>
    )
  }

  // ── FULL CARD ───────────────────────────────────────────────────────────────
  return (
    <article
      className={`bg-white p-4 transition-colors ${className ?? ''}`}
      style={{ border: '1px solid var(--posi-border)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
    >
      {/* Title + MQS score */}
      <div className="flex items-start gap-3 mb-2">
        <a
          href={titleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-[14px] font-semibold leading-snug hover:underline"
          style={{ color: 'var(--posi-text)' }}
        >
          {title}
        </a>
        <div className="shrink-0 text-right" style={{ minWidth: '2.5rem' }}>
          <span
            className="block font-bold font-mono leading-tight"
            style={{ color: mqsColor(article.metadata_quality_score), fontSize: '18px' }}
          >
            {article.metadata_quality_score}
          </span>
          <span
            className="block uppercase"
            style={{ color: 'var(--posi-soft)', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.12em' }}
          >
            MQS
          </span>
        </div>
      </div>

      {/* Authors */}
      {article.authors.length > 0 && (
        <p className="text-[12.5px] mb-1.5 leading-snug" style={{ color: 'var(--posi-muted)' }}>
          {article.authors.slice(0, 6).map((a, i) => (
            <span key={a.id}>
              {i > 0 && '; '}
              <span className={a.is_corresponding ? 'font-medium' : ''}>
                {a.family_name && a.given_name
                  ? `${a.family_name}, ${a.given_name.charAt(0)}.`
                  : a.display_name}
              </span>
            </span>
          ))}
          {article.authors.length > 6 && (
            <span style={{ color: 'var(--posi-soft)' }}> +{article.authors.length - 6}</span>
          )}
        </p>
      )}

      {/* Citation line */}
      <p className="text-[11.5px] mb-2" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
        {article.journal_title && (
          <em style={{ fontStyle: 'italic' }}>{decodeHtml(article.journal_title)}</em>
        )}
        {article.journal_title && (
          article.volume
            ? `. ${article.publication_year};${article.volume}`
            : `. ${article.publication_year}`
        )}
        {!article.journal_title && article.publication_year}
        {article.issue && `(${article.issue})`}
        {article.first_page && `:${article.first_page}${article.last_page ? `–${article.last_page}` : ''}`}
        {article.doi && (
          <>
            {' · '}
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-0.5"
              style={{ color: 'var(--posi-accent)', fontStyle: 'normal' }}
            >
              {article.doi}
              <ArrowSquareOut className="h-2.5 w-2.5" />
            </a>
          </>
        )}
      </p>

      {/* Abstract */}
      {showAbstract && article.abstract && (
        <p className="text-[12.5px] line-clamp-2 leading-relaxed mb-2" style={{ color: 'var(--posi-soft)' }}>
          {decodeHtml(article.abstract)}
        </p>
      )}

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {article.keywords.slice(0, 3).map(kw => (
            <Link
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="text-[11px] px-1.5 py-0.5 transition-colors"
              style={{ background: 'var(--posi-bg)', color: 'var(--posi-muted)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--posi-accent-light)'
                e.currentTarget.style.color = 'var(--posi-accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--posi-bg)'
                e.currentTarget.style.color = 'var(--posi-muted)'
              }}
            >
              {kw}
            </Link>
          ))}
        </div>
      )}

      {/* Footer: status badges (left) + action links (right) */}
      <div
        className="flex items-center justify-between gap-3 pt-2"
        style={{ borderTop: '1px solid var(--posi-border-light)' }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge label="OA" variant="oa" />
          {article.license && <Badge label={article.license} variant="license" />}
          {crInfo && <Badge label={crInfo.label} variant={crInfo.variant} />}
          {article.cited_by_count > 0 && (
            <span className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>
              {article.cited_by_count} cited
            </span>
          )}
        </div>

        {article.doi && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/cite?doi=${encodeURIComponent(article.doi)}`}
              className="text-[10px] uppercase tracking-[0.06em] flex items-center gap-1 transition-colors"
              style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-muted)')}
            >
              <Quotes className="h-3 w-3" />
              Cite
            </Link>
            <Link
              href={`/doi-lookup?doi=${encodeURIComponent(article.doi)}`}
              className="text-[10px] uppercase tracking-[0.06em] flex items-center gap-1 transition-colors"
              style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-muted)')}
            >
              <ArrowSquareOut className="h-3 w-3" />
              DOI Lookup
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
