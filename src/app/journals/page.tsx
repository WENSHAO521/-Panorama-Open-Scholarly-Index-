import { Info } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS } from '@/lib/data'
import { crossrefFetchJournal, issnGetCountry, oaiHarvestJournal } from '@/lib/api'
import { JournalTabs } from '@/components/JournalTabs'

export const metadata = {
  title: 'Journals',
  description: 'Browse PSG journals and indexed third-party journals, or search all journals in Crossref.',
}

export default async function JournalsPage() {
  const [psgRows, indexedRows] = await Promise.all([
    Promise.all(
      PSG_JOURNALS.map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? crossrefFetchJournal(j.issn_online).catch(() => null) : null,
          j.issn_online ? issnGetCountry(j.issn_online).catch(() => null) : null,
          oaiHarvestJournal(j.journal_code).catch(() => []),
        ])
        return { journal: j, cr, issnCountry, oaiCount: oaiItems.length }
      })
    ),
    Promise.all(
      [...INDEXED_JOURNALS, ...SHIHARR_JOURNALS].map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? crossrefFetchJournal(j.issn_online).catch(() => null) : null,
          j.issn_online ? issnGetCountry(j.issn_online).catch(() => null) : null,
          oaiHarvestJournal(j.journal_code).catch(() => []),
        ])
        return { journal: j, cr, issnCountry, oaiCount: oaiItems.length }
      })
    ),
  ])

  const total = PSG_JOURNALS.length + INDEXED_JOURNALS.length + SHIHARR_JOURNALS.length
  const totalArticles = [...psgRows, ...indexedRows].reduce(
    (s, { oaiCount, cr, journal }) => s + (oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)), 0
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

      <JournalTabs psgRows={psgRows} indexedRows={indexedRows} />

      {/* Column legend */}
      <div className="p-4 text-xs flex flex-col sm:flex-row gap-4 mt-8" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: 'var(--posi-muted)' }} />
          <p className="leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            <strong style={{ color: 'var(--posi-text)' }}>MQS</strong> = Metadata Quality Score (0–100).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>PQF</strong> = POSI Quality Factor (Grade A+→E).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>IRS</strong> = Indexing Readiness Score (A–D).{' '}
            Article counts from OAI-PMH (Crossref fallback).{' '}
            <Link href="/pqf" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>PQF methodology →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
