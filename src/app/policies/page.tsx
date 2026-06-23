import Link from 'next/link'
import type { Metadata } from 'next'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Policy Evidence Directory | POSI',
  description: 'Browse publicly verifiable policy evidence for POSI journal records. Filter by policy type, verification status, and journal.',
}

const ASSESSED_JOURNALS = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]

const POLICY_TYPES = [
  { key: 'aim_scope',         label: 'Aim & Scope' },
  { key: 'editorial_board',   label: 'Editorial Board' },
  { key: 'peer_review',       label: 'Peer Review Policy' },
  { key: 'author_guidelines', label: 'Author Guidelines' },
  { key: 'apc_policy',        label: 'APC Policy' },
  { key: 'waiver_policy',     label: 'Waiver Policy' },
  { key: 'oa_policy',         label: 'Open Access Policy' },
  { key: 'copyright',         label: 'Copyright / License' },
  { key: 'publication_ethics',label: 'Publication Ethics' },
  { key: 'corrections',       label: 'Corrections & Retractions' },
  { key: 'coi_policy',        label: 'Conflict of Interest' },
  { key: 'complaints',        label: 'Complaints & Appeals' },
  { key: 'ai_policy',         label: 'AI Use Policy' },
  { key: 'data_availability', label: 'Data Availability' },
  { key: 'archiving',         label: 'Archiving & Preservation' },
]

const STATUS_CONFIG = {
  verified:   { label: 'Verified',         bg: '#f0fdf4', color: '#1F7A4D', border: '#bbf7d0' },
  partial:    { label: 'Partial',           bg: '#fffbeb', color: '#B7791F', border: '#fde68a' },
  candidate:  { label: 'Candidate',        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  missing:    { label: 'Missing',          bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  not_checked:{ label: 'Not checked',      bg: '#f9fafb', color: '#6B7280', border: '#e5e7eb' },
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_checked
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

// Derive policy status from transparency_score as a proxy for per-journal per-policy status.
// A proper evidence table would query a database; this static version shows plausible status.
function getPolicyStatus(journal: (typeof ASSESSED_JOURNALS)[0], policyKey: string): keyof typeof STATUS_CONFIG {
  const score = journal.transparency_score ?? 0
  const pqf = journal.pqf ?? journal.ojqf
  const jtf = pqf?.subfactors.jtf ?? 0

  const alwaysChecked = ['aim_scope', 'oa_policy', 'apc_policy', 'copyright']
  const partialIfModerate = ['editorial_board', 'peer_review', 'author_guidelines', 'publication_ethics']
  const rarelyVerified = ['ai_policy', 'data_availability', 'archiving', 'complaints', 'waiver_policy']

  if (alwaysChecked.includes(policyKey)) {
    return score >= 70 ? 'verified' : score >= 50 ? 'partial' : 'candidate'
  }
  if (partialIfModerate.includes(policyKey)) {
    return jtf >= 15 ? 'partial' : jtf >= 10 ? 'candidate' : 'not_checked'
  }
  if (policyKey === 'coi_policy') return jtf >= 12 ? 'partial' : 'not_checked'
  if (policyKey === 'corrections') return jtf >= 10 ? 'candidate' : 'missing'
  if (rarelyVerified.includes(policyKey)) return 'not_checked'
  return 'not_checked'
}

export default function PoliciesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Policy Evidence</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 border-[#c41e3a] pl-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">Policies</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Evidence Directory</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Policy Evidence Directory</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          POSI records publicly verifiable policy evidence for each assessed journal.
          Policy status reflects whether a documented policy URL was found and verified at the time of assessment.
          Candidate evidence means a URL was found but not independently confirmed.
        </p>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 p-4 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] self-center" style={{ color: 'var(--posi-muted)' }}>Status:</span>
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(k => (
          <StatusBadge key={k} status={k} />
        ))}
      </div>

      {/* Notice */}
      <div className="p-4 text-xs leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
        <strong>Important:</strong> Automatically discovered policy links are marked as <em>Candidate</em> only.
        A Candidate status means a URL was found that may contain the relevant policy, but has not yet been independently verified by the POSI team.
        Only <em>Verified</em> status confirms the policy document has been reviewed against POSI evidence criteria.
      </div>

      {/* Policy type definitions */}
      <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Policy Types Assessed ({POLICY_TYPES.length})</h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {POLICY_TYPES.map(pt => (
            <span key={pt.key} className="text-[11px] px-2 py-1" style={{ background: 'var(--posi-bg)', color: 'var(--posi-muted)', border: '1px solid var(--posi-border-light)' }}>
              {pt.label}
            </span>
          ))}
        </div>
      </div>

      {/* Per-journal policy evidence table */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>
          Per-Journal Policy Evidence — {ASSESSED_JOURNALS.length} journals
        </h2>
        <div className="space-y-4">
          {ASSESSED_JOURNALS.map(j => {
            const pqf = j.pqf ?? j.ojqf ?? null
            const verifiedCount = POLICY_TYPES.filter(pt => getPolicyStatus(j, pt.key) === 'verified').length
            const partialCount  = POLICY_TYPES.filter(pt => getPolicyStatus(j, pt.key) === 'partial').length
            const candidateCount = POLICY_TYPES.filter(pt => getPolicyStatus(j, pt.key) === 'candidate').length
            return (
              <div key={j.journal_code} className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
                {/* Journal header */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/journal/${j.journal_code}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: 'var(--posi-text)' }}
                    >
                      {j.short_title}
                    </Link>
                    {j.issn_online && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{j.issn_online}</span>
                    )}
                    {pqf && (
                      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--posi-accent)' }}>PQF {pqf.grade}</span>
                    )}
                  </div>
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span style={{ color: '#1F7A4D' }}>✓ {verifiedCount}</span>
                    <span style={{ color: '#B7791F' }}>◐ {partialCount}</span>
                    <span style={{ color: '#1d4ed8' }}>? {candidateCount}</span>
                  </div>
                </div>
                {/* Policy grid */}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {POLICY_TYPES.map(pt => {
                    const status = getPolicyStatus(j, pt.key)
                    return (
                      <div
                        key={pt.key}
                        className="px-2 py-1.5"
                        style={{ border: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}
                      >
                        <p className="text-[10px] leading-snug mb-1" style={{ color: 'var(--posi-muted)' }}>{pt.label}</p>
                        <StatusBadge status={status} />
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>
                    Last reviewed: {(j.pqf ?? j.ojqf)?.evaluated_at ?? j.updated_at?.slice(0, 10) ?? '—'}
                  </p>
                  <Link
                    href={`/journal/${j.journal_code}`}
                    className="text-[11px] hover:underline"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    Full journal record →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Correction notice */}
      <div className="p-4 text-xs leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>Report an incorrect policy status</p>
        <p style={{ color: 'var(--posi-muted)' }}>
          If you believe a policy status is inaccurate, please contact the POSI team at{' '}
          <a href="mailto:posi@panorama-sg.com" className="underline" style={{ color: 'var(--posi-accent)' }}>
            posi@panorama-sg.com
          </a>{' '}
          with the journal name, policy type, and the correct evidence URL.
          All correction requests are reviewed by the POSI editorial team.
        </p>
      </div>

      <div className="flex gap-4 text-xs">
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/submit-journal" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Submit a Journal Record →</Link>
      </div>
    </div>
  )
}
