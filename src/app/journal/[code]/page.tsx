import { ALL_JOURNALS } from '@/lib/data'

export async function generateStaticParams() {
  // Exclude discovered journals (j-disc- prefix) to stay within Cloudflare Pages'
  // 20,000-file deployment limit. Discovered journals link to their external website.
  return ALL_JOURNALS
    .filter(j => !j.id.startsWith('j-disc-'))
    .map(j => ({ code: j.journal_code }))
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowSquareOut, Globe, FileText, Users, Barcode, ChartBar } from '@phosphor-icons/react/dist/ssr'
import { getJournalByCode } from '@/lib/data'
import { crossrefGetJournalWorks, crossrefFetchJournal, doajGetJournal, issnGetCountry, oaiHarvestJournal } from '@/lib/api'
import type { DoajJournalInfo } from '@/lib/types'
import { Badge } from '@/components/Badge'
import { MetadataQualityBar } from '@/components/MetadataQualityBar'
import { OjqfCard } from '@/components/OjqfCard'
import { JournalArticles } from '@/components/JournalArticles'
import { ArticleCountBadge } from '@/components/ArticleCountBadge'

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const journal = getJournalByCode(code)
  if (!journal) return { title: 'Journal Not Found' }
  const isPsg = journal.publisher?.toLowerCase().includes('panorama')
  const recordType = journal.id.startsWith('j-disc-')
    ? (journal.doaj_status === 'listed' ? 'DOAJ-listed Journal Record' : 'Auto-discovered Journal Record')
    : 'POSI Verified Journal Record'
  return {
    title: `${journal.title} | POSI Journal Record`,
    description: `${recordType}. ${isPsg ? 'Published by Panorama Scholarly Group. ' : ''}eISSN: ${journal.issn_online ?? '—'}. Browse PQF assessment, policy evidence, and metadata quality data.`,
  }
}

const ISO_COUNTRY: Record<string, string> = {
  AF:'Afghanistan',AR:'Argentina',AT:'Austria',AU:'Australia',BE:'Belgium',BR:'Brazil',
  CA:'Canada',CH:'Switzerland',CN:'China',CZ:'Czech Republic',DE:'Germany',DK:'Denmark',
  EG:'Egypt',ES:'Spain',FI:'Finland',FR:'France',GB:'United Kingdom',GR:'Greece',
  HR:'Croatia',HU:'Hungary',ID:'Indonesia',IE:'Ireland',IL:'Israel',IN:'India',
  IR:'Iran',IT:'Italy',JP:'Japan',KR:'South Korea',MX:'Mexico',MY:'Malaysia',
  NL:'Netherlands',NO:'Norway',NZ:'New Zealand',PH:'Philippines',PL:'Poland',
  PT:'Portugal',RO:'Romania',RS:'Serbia',RU:'Russia',SA:'Saudi Arabia',SE:'Sweden',
  SG:'Singapore',SI:'Slovenia',SK:'Slovakia',TH:'Thailand',TR:'Turkey',
  TW:'Taiwan',UA:'Ukraine',US:'United States',ZA:'South Africa',
}

function weeksToFrequency(weeks: number | null | undefined): string | null {
  if (weeks === null || weeks === undefined) return null
  if (weeks <= 1) return 'Weekly'
  if (weeks <= 2) return 'Biweekly'
  if (weeks <= 5) return 'Monthly'
  if (weeks <= 9) return 'Bimonthly'
  if (weeks <= 16) return 'Quarterly'
  if (weeks <= 22) return 'Triannual'
  if (weeks <= 30) return 'Biannual'
  return 'Annual'
}

const INDEXING_LABEL: Record<string, string> = {
  A: 'A — High Readiness',
  B: 'B — Moderate Readiness',
  C: 'C — Developing',
  D: 'D — Early Stage',
  'Internal Review': 'Internal Review',
}

const INDEXING_VARIANT = {
  A: 'indexing-a' as const,
  B: 'indexing-b' as const,
  C: 'indexing-c' as const,
  D: 'indexing-d' as const,
  'Internal Review': 'default' as const,
}

export default async function JournalPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  const journal = getJournalByCode(code)
  if (!journal) notFound()

  let total = 0
  let articles: import('@/lib/types').Article[] = []
  let doaj: DoajJournalInfo | null = null
  let publisherLocation: string | null = null

  // Discovered journals already have metadata from data.ts — skip redundant API calls
  const isDiscovered = journal.id.startsWith('j-disc-')

  const [doajResult, crMeta, issnCountry] = await Promise.all([
    // Skip DOAJ if journal is already auto-scored (all its info is in data.ts)
    !isDiscovered && journal.issn_online ? doajGetJournal(journal.issn_online).catch(() => null) : null,
    // Skip Crossref meta for discovered journals (article_count comes from data.ts)
    !isDiscovered && journal.issn_online ? crossrefFetchJournal(journal.issn_online).catch(() => null) : null,
    // Skip ISSN country lookup for discovered journals (registration_country already in data.ts)
    !isDiscovered && !journal.registration_country && journal.issn_online ? issnGetCountry(journal.issn_online).catch(() => null) : null,
  ])
  doaj = doajResult
  const doajCountry = doajResult?.publisher_country_code ? (ISO_COUNTRY[doajResult.publisher_country_code] ?? doajResult.publisher_country_code) : null
  publisherLocation = journal.registration_country ?? issnCountry ?? crMeta?.publisher_location ?? doajCountry ?? null
  const frequency = journal.frequency || weeksToFrequency(doajResult?.publication_time_weeks) || null

  // OAI-PMH only for PSG journals (oai_base_url set); skip for discovered journals to avoid
  // 12s timeout on every website_url/oai attempt across 22k journals at build time
  const oaiItems = isDiscovered ? [] : await oaiHarvestJournal(journal.journal_code).catch(() => [])
  if (oaiItems.length > 0) {
    total = oaiItems.length
    articles = oaiItems.slice(0, 20)
  }
  if (!isDiscovered && articles.length === 0 && journal.issn_online) {
    const cr = await crossrefGetJournalWorks(journal.issn_online, { page: 1, rows: 20 })
    total = crMeta?.total_dois ?? cr.total
    articles = cr.items
  }
  if (isDiscovered && articles.length === 0) {
    total = journal.article_count
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="transition-colors hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/journals" className="transition-colors hover:text-gray-700">Journal Records</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>{journal.short_title}</span>
      </nav>

      {/* Record Status panel */}
      {(() => {
        const isDiscovered = journal.id.startsWith('j-disc-')
        const isPsg = journal.id.startsWith('j-') && !isDiscovered && journal.publisher?.toLowerCase().includes('panorama')
        const recordType = isPsg ? 'POSI Verified Journal Record'
          : !isDiscovered ? 'POSI Verified Journal Record'
          : journal.doaj_status === 'listed' ? 'DOAJ-listed Journal Record'
          : 'Auto-discovered Journal Record'
        const verStatus = !isDiscovered ? 'Verified' : journal.doaj_status === 'listed' ? 'DOAJ-confirmed' : 'Not verified'
        const pqfStatus = (journal.pqf ?? journal.ojqf) ? 'Official' : journal.auto_pqf ? 'Automated' : 'Pending'
        const policyStatus = journal.transparency_score >= 70 ? 'Partial' : 'Not checked'
        const lastReviewed = (journal.pqf ?? journal.ojqf)?.evaluated_at ?? journal.updated_at?.slice(0, 10) ?? '—'
        const statusColor = (s: string) =>
          s === 'Verified' || s === 'Official' || s === 'DOAJ-confirmed' ? '#1F7A4D'
          : s === 'Partial' || s === 'Automated' ? '#B7791F'
          : '#6B7280'
        return (
          <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>Record Status</span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--posi-muted)' }}>Last reviewed: {lastReviewed}</span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Record Type', value: recordType },
                { label: 'Verification', value: verStatus },
                { label: 'PQF Status', value: pqfStatus },
                { label: 'Policy Evidence', value: policyStatus },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[9px] uppercase tracking-[0.1em] mb-0.5" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</p>
                  <p className="text-xs font-semibold" style={{ color: statusColor(item.value) }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Header */}
      <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-4">
          {journal.cover_image_url && (
            <img
              src={journal.cover_image_url}
              alt={`${journal.short_title} cover`}
              className="w-16 shrink-0 object-cover"
              style={{ aspectRatio: '2/3', border: '1px solid var(--posi-border)' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>{journal.title}</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--posi-muted)' }}>{journal.publisher} · {journal.country}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge label="OA" variant="oa" />
              <Badge label={journal.license} variant="license" />
              {journal.doaj_status && (
                <Badge
                  label={`DOAJ: ${journal.doaj_status === 'application_submitted' ? 'application submitted' : journal.doaj_status.replace('_', ' ')}`}
                  variant={
                    journal.doaj_status === 'listed' ? 'doaj-listed'
                    : journal.doaj_status === 'application_submitted' ? 'doaj-pending'
                    : 'doaj-not'
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
          {[
            journal.issn_print && journal.issn_online
              ? { icon: Barcode, label: 'ISSN', value: `p ${journal.issn_print} / e ${journal.issn_online}` }
              : journal.issn_online
                ? { icon: Barcode, label: 'eISSN', value: journal.issn_online }
                : { icon: Barcode, label: 'pISSN', value: journal.issn_print || 'N/A' },
            ...(publisherLocation ? [{ icon: Globe, label: 'ISSN Reg.', value: publisherLocation }] : []),
            ...(frequency ? [{ icon: FileText, label: 'Frequency', value: frequency }] : []),
            { icon: Users, label: 'Peer Review', value: journal.peer_review_type },
            { icon: Globe, label: 'Language', value: journal.language },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <item.icon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--posi-muted)' }}>{item.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--posi-text)' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {journal.website_url && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
            <a
              href={journal.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs hover:underline transition-colors"
              style={{ color: 'var(--posi-accent)' }}
            >
              <ArrowSquareOut className="h-3.5 w-3.5" />
              {journal.website_url}
            </a>
          </div>
        )}
      </div>

      {/* PQF — official first, auto-assessed as fallback */}
      {(journal.pqf ?? journal.ojqf)
        ? <OjqfCard score={(journal.pqf ?? journal.ojqf)!} journalCode={journal.journal_code} />
        : journal.auto_pqf
          ? <OjqfCard score={journal.auto_pqf} journalCode={journal.journal_code} isAuto />
          : null
      }

      {/* Policy Evidence Summary */}
      {!journal.id.startsWith('j-disc-') && (() => {
        const pqf = journal.pqf ?? journal.ojqf
        const jtf = pqf?.subfactors.jtf ?? 0
        const score = journal.transparency_score ?? 0
        const policies: { label: string; status: 'verified' | 'partial' | 'candidate' | 'missing' | 'not_checked' }[] = [
          { label: 'Aim & Scope',           status: score >= 70 ? 'verified' : 'partial' },
          { label: 'Editorial Board',       status: jtf >= 15 ? 'partial' : 'candidate' },
          { label: 'Peer Review Policy',    status: jtf >= 15 ? 'partial' : 'candidate' },
          { label: 'APC Policy',            status: score >= 60 ? 'verified' : 'partial' },
          { label: 'Open Access Policy',    status: score >= 70 ? 'verified' : 'partial' },
          { label: 'Copyright / License',   status: score >= 65 ? 'verified' : 'partial' },
          { label: 'Publication Ethics',    status: jtf >= 12 ? 'partial' : 'candidate' },
          { label: 'Corrections Policy',    status: jtf >= 10 ? 'candidate' : 'missing' },
          { label: 'AI Use Policy',         status: 'not_checked' },
        ]
        const STATUS_CFG = {
          verified:   { label: 'Verified',     color: '#1F7A4D', bg: '#f0fdf4', border: '#bbf7d0' },
          partial:    { label: 'Partial',       color: '#B7791F', bg: '#fffbeb', border: '#fde68a' },
          candidate:  { label: 'Candidate',    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          missing:    { label: 'Missing',       color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
          not_checked:{ label: 'Not checked',  color: '#6B7280', bg: '#f9fafb', border: '#e5e7eb' },
        }
        return (
          <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>Policy Evidence</span>
              <Link href="/policies" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
                Full directory →
              </Link>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {policies.map(p => {
                const cfg = STATUS_CFG[p.status]
                return (
                  <div key={p.label} className="px-2 py-1.5" style={{ border: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
                    <p className="text-[10px] leading-snug mb-1" style={{ color: 'var(--posi-muted)' }}>{p.label}</p>
                    <span className="text-[10px] font-medium px-1 py-0.5" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-2 text-[10px]" style={{ borderTop: '1px solid var(--posi-border-light)', color: 'var(--posi-muted)' }}>
              Policy evidence is based on publicly available information at the time of assessment.{' '}
              <a href={`mailto:posi@panorama-sg.com?subject=Policy correction: ${journal.short_title}`} className="underline" style={{ color: 'var(--posi-accent)' }}>
                Report a correction
              </a>
            </div>
          </div>
        )
      })()}

      {/* Two-column: sidebar + articles */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-4">
          {/* Quality scores */}
          <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
              <ChartBar className="h-3.5 w-3.5" />
              Quality Scores
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--posi-muted)' }}>
                  <span>Metadata Quality (MQS)</span>
                  <span className="font-mono font-medium">{journal.metadata_quality_score}/100</span>
                </div>
                <MetadataQualityBar score={journal.metadata_quality_score} showLabel={false} />
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--posi-muted)' }}>
                  <span>Transparency Score (JTS)</span>
                  <span className="font-mono font-medium">{journal.transparency_score}/100</span>
                </div>
                <div className="w-full h-1.5" style={{ background: 'var(--posi-bg)' }}>
                  <div className="h-1.5" style={{ width: `${journal.transparency_score}%`, background: 'var(--posi-accent)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Discoverability Score */}
          <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>
              Discoverability Score
            </h2>
            <div className="text-center py-1">
              <span className="text-5xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{journal.indexing_readiness}</span>
            </div>
            <div className="mt-2 text-center">
              <Badge
                label={INDEXING_LABEL[journal.indexing_readiness]}
                variant={INDEXING_VARIANT[journal.indexing_readiness] || 'default'}
              />
            </div>
            <p className="text-[10px] mt-2 text-center leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              Technical readiness for OAI-PMH, sitemap, DOI resolution, and Schema.org
            </p>
          </div>

          {/* Collection */}
          <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>Collection</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--posi-muted)' }}>Total Articles</span>
                <ArticleCountBadge issn={journal.issn_online ?? null} fallback={total || journal.article_count} />
              </div>
              {journal.openalex_source_id && (
                <a
                  href={`https://openalex.org/sources/${journal.openalex_source_id}`}
                  className="block text-[11px] hover:underline mt-1 transition-colors"
                  style={{ color: 'var(--posi-accent)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on OpenAlex →
                </a>
              )}
            </div>
          </div>

          {/* DOAJ */}
          <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
              DOAJ Status
            </h2>
            {doaj ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--posi-muted)' }}>Listed</span>
                  <span
                    className="font-semibold"
                    style={{ color: doaj.in_doaj ? '#1F7A4D' : '#6B7280' }}
                  >
                    {doaj.in_doaj ? 'Yes' : 'No'}
                  </span>
                </div>
                {doaj.has_seal && (
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--posi-muted)' }}>DOAJ Seal</span>
                    <span className="font-semibold" style={{ color: '#1F7A4D' }}>✓</span>
                  </div>
                )}
                {doaj.license && (
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--posi-muted)' }}>License</span>
                    <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{doaj.license}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--posi-muted)' }}>APC</span>
                  <span style={{ color: 'var(--posi-text)' }}>
                    {doaj.has_apc
                      ? doaj.apc_max.length
                        ? doaj.apc_max.map(a => `${a.currency} ${a.price}`).join(', ')
                        : 'Yes'
                      : 'No charge'}
                  </span>
                </div>
                {doaj.doaj_id && (
                  <a
                    href={`https://doaj.org/toc/${doaj.doaj_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] hover:underline mt-1 transition-colors"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    View on DOAJ →
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--posi-muted)' }}>Status</span>
                  <span style={{ color: 'var(--posi-muted)' }}>
                    {journal.doaj_status === 'listed' ? 'Listed'
                      : journal.doaj_status === 'application_submitted' ? 'Application submitted'
                      : 'Not listed'}
                  </span>
                </div>
                <a
                  href={`https://doaj.org/search/journals?source=%7B%22query%22%3A%7B%22query_string%22%3A%7B%22query%22%3A%22${journal.issn_online}%22%7D%7D%7D`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] hover:underline mt-1 transition-colors"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  Search on DOAJ →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="md:col-span-2">
          <JournalArticles
            issn={journal.issn_online ?? null}
            journalCode={journal.journal_code}
            initialArticles={articles}
            initialTotal={total}
          />
        </div>
      </div>
    </div>
  )
}
