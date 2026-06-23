import Link from 'next/link'
import type { Metadata } from 'next'
import { PSG_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Conflict of Interest Disclosure | POSI',
  description: 'POSI is operated by Panorama Scholarly Group. This page discloses the structural conflict of interest and the measures in place to ensure scoring transparency.',
}

export default function CoiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/about" className="hover:text-gray-700">About</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Conflict of Interest Disclosure</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: '#d97706' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Conflict of Interest Disclosure</h1>
        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
          POSI is committed to transparency about its organizational structure and the potential
          conflicts of interest that arise from it.
        </p>
      </div>

      {/* Main COI statement */}
      <div className="p-5" style={{ background: '#fefce8', border: '1px solid #fde68a', borderLeft: '4px solid #d97706' }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: '#92400e' }}>Primary Conflict of Interest</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
          <strong>POSI is operated by Panorama Scholarly Group Ltd. (PSG).</strong> PSG also publishes{' '}
          {PSG_JOURNALS.length} academic journals that are listed in POSI and receive PQF assessments.
          This creates a structural conflict of interest: the same organization that operates the
          assessment platform also publishes journals that benefit from or are affected by that assessment.
        </p>
      </div>

      {/* What this means */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What This Means in Practice</h2>
        <div className="space-y-3">
          {[
            {
              title: 'PSG journals are assessed under the same PQF criteria as all other journals',
              body: 'No special criteria, weighting adjustments, or manual overrides are applied to PSG journal records. PQF scoring is criterion-based and binary — each criterion is met or not met based on publicly verifiable evidence.',
            },
            {
              title: 'PSG journal PQF scores may be inflated due to inside knowledge',
              body: 'Because PSG operates the journals, the review team may have access to unpublished policy documents or context that external journals do not. We work to restrict PQF scoring to publicly accessible evidence only, but this risk cannot be fully eliminated.',
            },
            {
              title: 'POSI benefits reputationally when PSG journals score well',
              body: 'High PQF scores for PSG journals serve as demonstration of the platform\'s utility, which creates a financial and reputational incentive for PSG. Readers should weigh this when interpreting PSG journal scores.',
            },
            {
              title: 'POSI does not receive journal processing charges (APCs) from PSG journals',
              body: 'POSI journal assessment is currently free. PSG does not pay POSI for favorable coverage. However, as both are operated by the same legal entity, this distinction has organizational rather than financial significance.',
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-[10px] font-mono font-bold mt-0.5 shrink-0" style={{ color: '#d97706' }}>{i + 1}.</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PSG journals in POSI */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            PSG Journals Currently in POSI ({PSG_JOURNALS.length} records)
          </h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {PSG_JOURNALS.map(j => (
            <div key={j.id} className="px-5 py-2.5 flex items-center justify-between gap-4">
              <div>
                <Link
                  href={`/journal/${j.journal_code}`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--posi-text)' }}
                >
                  {j.title}
                </Link>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--posi-muted)' }}>
                  eISSN {j.issn_online} · {j.journal_code.toUpperCase()}
                </p>
              </div>
              {j.pqf && (
                <span className="text-sm font-bold font-mono shrink-0" style={{ color: 'var(--posi-accent)' }}>
                  {j.pqf.grade}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mitigation measures */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Mitigation Measures</h2>
        <ul className="space-y-2.5">
          {[
            'All PQF criteria are publicly documented and independently verifiable by any reader.',
            'PQF scoring uses only publicly accessible evidence — no internal editorial systems or unpublished data.',
            'All PSG journal PQF records include a visible conflict of interest notice on their detail pages.',
            'POSI does not charge journals for assessment or listing, eliminating pay-to-score incentives.',
            'The PQF methodology, criteria weights, and scoring rubric are published and version-controlled.',
            'Independent third-party verification of PSG journal PQF scores is encouraged and welcomed.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Responsible use */}
      <div className="p-4 text-xs leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <p style={{ color: 'var(--posi-muted)' }}>
          <strong style={{ color: 'var(--posi-text)' }}>Recommendation for readers: </strong>
          When reviewing PQF scores for PSG journals, independently verify the criteria against the journal's public website.
          Use PQF as one of several inputs to journal evaluation, not as the sole indicator.
          For critical decisions, consult DOAJ, Crossref, and other independent open access registries.
        </p>
      </div>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About POSI →</Link>
        <Link href="/responsible-use" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Responsible Use Notice →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
      </div>

    </div>
  )
}
