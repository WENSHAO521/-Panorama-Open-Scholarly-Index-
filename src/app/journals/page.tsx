import { Suspense } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, DISCOVERED_JOURNALS } from '@/lib/data'
import { crossrefFetchJournal, issnGetCountry, oaiHarvestJournal } from '@/lib/api'
import { JournalTabs, type SlimJournal } from '@/components/JournalTabs'
import type { Journal } from '@/lib/types'

// Reduce full Journal objects to only fields needed by the journal list table.
// This keeps the serialized HTML well below Cloudflare Pages' 25 MB file limit.
function slim(j: Journal, cr_total_dois?: number | null, issnCountry?: string | null, oaiCount?: number) {
  const officialScore = j.pqf ?? j.ojqf
  const score = officialScore ?? j.auto_pqf ?? null
  const s: SlimJournal = {
    id: j.id,
    title: j.title,
    short_title: j.short_title,
    journal_code: j.journal_code,
    issn_print: j.issn_print,
    issn_online: j.issn_online,
    publisher: j.publisher,
    metadata_quality_score: j.metadata_quality_score,
    indexing_readiness: j.indexing_readiness,
    doaj_status: j.doaj_status ?? null,
    website_url: j.website_url,
    article_count: j.article_count,
    registration_country: j.registration_country ?? null,
    subjects: j.subjects ?? null,
    pqf_grade: score?.grade ?? null,
    pqf_total: score?.total ?? null,
    pqf_is_auto: !officialScore && !!j.auto_pqf,
  }
  return { journal: s, cr_total_dois: cr_total_dois ?? null, issnCountry: issnCountry ?? null, oaiCount: oaiCount ?? 0 }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(res => setTimeout(() => res(fallback), ms))])
}

export const metadata = {
  title: 'Journals',
  description: 'Browse PSG journals and indexed third-party journals, or search all journals in Crossref.',
}

export default async function JournalsPage() {
  const TIMEOUT_MS = 4000
  const [psgRows, manualIndexedRows] = await Promise.all([
    Promise.all(
      PSG_JOURNALS.map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? withTimeout(crossrefFetchJournal(j.issn_online).catch(() => null), TIMEOUT_MS, null) : null,
          j.issn_online ? withTimeout(issnGetCountry(j.issn_online).catch(() => null), TIMEOUT_MS, null) : null,
          withTimeout(oaiHarvestJournal(j.journal_code).catch(() => []), TIMEOUT_MS, []),
        ])
        return slim(j, cr?.total_dois, issnCountry, (oaiItems as unknown[]).length)
      })
    ),
    Promise.all(
      [...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS].map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? withTimeout(crossrefFetchJournal(j.issn_online).catch(() => null), TIMEOUT_MS, null) : null,
          j.issn_online ? withTimeout(issnGetCountry(j.issn_online).catch(() => null), TIMEOUT_MS, null) : null,
          withTimeout(oaiHarvestJournal(j.journal_code).catch(() => []), TIMEOUT_MS, []),
        ])
        return slim(j, cr?.total_dois, issnCountry, (oaiItems as unknown[]).length)
      })
    ),
  ])

  // Trust doaj_status from data.ts — skips live DOAJ check for faster builds.
  const doajConfirmedRows = DISCOVERED_JOURNALS
    .filter(j => j.doaj_status === 'listed')
    .map(j => slim(j, null, j.registration_country ?? (j.country || null), 0))

  const nonDoajDiscoveredRows = DISCOVERED_JOURNALS
    .filter(j => j.doaj_status !== 'listed')
    .map(j => slim(j, null, j.registration_country ?? (j.country || null), 0))

  // Verified Records = manual indexed + DOAJ-confirmed discovered
  const allIndexedRows = [...manualIndexedRows, ...doajConfirmedRows]

  const total = PSG_JOURNALS.length + INDEXED_JOURNALS.length + SHIHARR_JOURNALS.length + OTHER_INDEXED_JOURNALS.length + DISCOVERED_JOURNALS.length
  const totalArticles = [...psgRows, ...manualIndexedRows].reduce(
    (s, { oaiCount, cr_total_dois, journal }) => s + ((oaiCount ?? 0) > 0 ? (oaiCount ?? 0) : (cr_total_dois ?? journal.article_count)), 0
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--posi-text)' }}>Journals</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
            {total} journals · {totalArticles.toLocaleString()} articles
          </p>
        </div>
      </div>

      {/* COI notice — shown on all journal listing pages */}
      <div
        className="mb-5 px-4 py-3 text-xs leading-relaxed"
        style={{ background: '#fefce8', border: '1px solid #fde68a', borderLeft: '3px solid #d97706' }}
      >
        <strong style={{ color: '#92400e' }}>Conflict of Interest Disclosure: </strong>
        <span style={{ color: '#78350f' }}>
          POSI is operated by Panorama Scholarly Group (PSG). Some journals listed here are published by PSG.
          PQF is a transparency and metadata-readiness framework, not an indexing status, impact metric, or endorsement of scholarly quality.
        </span>{' '}
        <Link href="/about" className="underline" style={{ color: '#92400e' }}>Full governance disclosure →</Link>
      </div>

      <Suspense fallback={<div className="text-xs py-8 text-center" style={{ color: 'var(--posi-muted)' }}>Loading journals…</div>}>
        <JournalTabs psgRows={psgRows} indexedRows={allIndexedRows} discoveredRows={nonDoajDiscoveredRows} />
      </Suspense>

      {/* Column legend */}
      <div className="p-4 text-xs flex flex-col sm:flex-row gap-4 mt-8" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: 'var(--posi-muted)' }} />
          <p className="leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            <strong style={{ color: 'var(--posi-text)' }}>MQS</strong> = Metadata Quality Score (0–100).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>PQF</strong> = POSI Quality Framework (Grade A+→E); <strong style={{ color: '#B45309' }}>PQF*</strong> = auto-assessed from DOAJ signals (pending manual review).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>IRS</strong> = Discoverability Score (A–D).{' '}
            Article counts from OAI-PMH (Crossref fallback).{' '}
            <Link href="/pqf" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>PQF methodology →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
