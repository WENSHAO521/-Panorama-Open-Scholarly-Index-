import Link from 'next/link'
import type { Metadata } from 'next'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'

const ASSESSED_JOURNALS = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]

export const metadata: Metadata = {
  title: 'Evidence Registry | POSI',
  description: 'The POSI Evidence Registry records the publicly auditable evidence behind every PQF score. Each criterion is linked to a verifiable source.',
}

const EVIDENCE_CRITERIA = [
  {
    factor: 'JTF',
    label: 'Journal Transparency Factor',
    color: '#c41e3a',
    criteria: [
      { name: 'Aim & Scope',           status: 'verified',       source: 'Journal website' },
      { name: 'Peer Review Policy',    status: 'verified',       source: 'Journal website' },
      { name: 'Editorial Board',       status: 'partial',        source: 'Journal website' },
      { name: 'APC Policy',            status: 'verified',       source: 'Journal website' },
      { name: 'Waiver Policy',         status: 'partial',        source: 'Journal website' },
      { name: 'Open Access Policy',    status: 'verified',       source: 'Journal website' },
      { name: 'Copyright & License',   status: 'verified',       source: 'Crossref / Journal website' },
      { name: 'Ethics Policy',         status: 'partial',        source: 'Journal website' },
      { name: 'Retraction Policy',     status: 'missing',        source: '—' },
    ],
  },
  {
    factor: 'MQF',
    label: 'Metadata Quality Factor',
    color: '#1e3a5f',
    criteria: [
      { name: 'DOI Registration',      status: 'verified',       source: 'Crossref API' },
      { name: 'Crossref Metadata',     status: 'verified',       source: 'Crossref API' },
      { name: 'Author Names',          status: 'verified',       source: 'Crossref API' },
      { name: 'ORCID Coverage',        status: 'partial',        source: 'Crossref API / OpenAlex' },
      { name: 'Abstract & Keywords',   status: 'partial',        source: 'Crossref API / OAI-PMH' },
      { name: 'Reference Lists',       status: 'missing',        source: 'Crossref API' },
      { name: 'License URI',           status: 'partial',        source: 'Crossref API' },
      { name: 'Full-text Links',       status: 'verified',       source: 'Crossref API / Journal website' },
      { name: 'Article Type',          status: 'verified',       source: 'Crossref API' },
    ],
  },
  {
    factor: 'EGF',
    label: 'Editorial Governance Factor',
    color: '#374151',
    criteria: [
      { name: 'Editor-in-Chief',       status: 'verified',       source: 'Journal website' },
      { name: 'Editorial Board',       status: 'partial',        source: 'Journal website' },
      { name: 'Board Affiliations',    status: 'partial',        source: 'Journal website' },
      { name: 'Geographic Diversity',  status: 'partial',        source: 'Manual assessment' },
      { name: 'Reviewer Guidelines',   status: 'partial',        source: 'Journal website' },
      { name: 'Author Contribution',   status: 'missing',        source: '—' },
      { name: 'COI Policy',            status: 'partial',        source: 'Journal website' },
      { name: 'AI Use Policy',         status: 'missing',        source: '—' },
      { name: 'Appeals Policy',        status: 'missing',        source: '—' },
    ],
  },
  {
    factor: 'TDF',
    label: 'Technical Discoverability Factor',
    color: '#1F7A4D',
    criteria: [
      { name: 'sitemap.xml',           status: 'partial',        source: 'Automated check' },
      { name: 'robots.txt',            status: 'verified',       source: 'Automated check' },
      { name: 'OAI-PMH',              status: 'partial',        source: 'OAI-PMH harvest' },
      { name: 'Schema.org JSON-LD',   status: 'missing',        source: 'Automated check' },
      { name: 'Google Scholar Tags',  status: 'partial',        source: 'Manual check' },
      { name: 'DOI Resolution',       status: 'verified',       source: 'doi.org resolver' },
      { name: 'Accessible Pages',     status: 'partial',        source: 'Manual check' },
    ],
  },
  {
    factor: 'CVF',
    label: 'Citation Visibility Factor',
    color: '#B7791F',
    criteria: [
      { name: 'Crossref Cited-by',    status: 'missing',        source: 'Crossref API' },
      { name: 'OpenAlex Matched',     status: 'partial',        source: 'OpenAlex API' },
      { name: 'OpenCitations',        status: 'missing',        source: 'OpenCitations API' },
      { name: 'Open References (I4OC)', status: 'missing',      source: 'Crossref API' },
      { name: 'Citation Attribution', status: 'verified',       source: 'POSI data policy' },
    ],
  },
  {
    factor: 'RIF',
    label: 'Research Integrity Factor',
    color: '#7C3AED',
    criteria: [
      { name: 'Retraction Policy',    status: 'missing',        source: '—' },
      { name: 'Plagiarism Policy',    status: 'partial',        source: 'Journal website' },
      { name: 'Data Availability',    status: 'missing',        source: '—' },
      { name: 'Ethics / Consent',     status: 'partial',        source: 'Journal website' },
      { name: 'Authorship Criteria',  status: 'partial',        source: 'Journal website' },
    ],
  },
]

const STATUS_CONFIG = {
  verified:      { label: 'Verified',        bg: '#f0fdf4', color: '#1F7A4D', border: '#bbf7d0' },
  partial:       { label: 'Partially met',   bg: '#fffbeb', color: '#B7791F', border: '#fde68a' },
  missing:       { label: 'Missing',         bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  outdated:      { label: 'Outdated',        bg: '#f9fafb', color: '#6B7280', border: '#e5e7eb' },
  manual_review: { label: 'Manual review',   bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.outdated
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

export default function EvidencePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Evidence Registry</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">Evidence</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Public Registry</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Evidence Registry</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          The POSI Evidence Registry records the publicly auditable evidence behind every PQF score.
          Each PQF criterion is linked to a verifiable public source. Evidence status is updated during
          each assessment cycle.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] self-center" style={{ color: 'var(--posi-muted)' }}>Status:</span>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <StatusBadge key={key} status={key} />
        ))}
      </div>

      {/* Per-journal evidence records */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Per-Journal Evidence Records</h2>
        <div className="bg-white overflow-x-auto" style={{ border: '1px solid var(--posi-border)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>JTF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>MQF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>EGF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>TDF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>CVF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>RIF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PQF</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {ASSESSED_JOURNALS.map(j => {
                const score = j.pqf ?? j.ojqf ?? null
                return (
                  <tr key={j.journal_code} style={{ borderBottom: '1px solid var(--posi-border-light)' }} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium leading-tight" style={{ color: 'var(--posi-text)' }}>{j.short_title}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--posi-muted)' }}>{j.issn_online || j.issn_print || '—'}</p>
                    </td>
                    {score ? (
                      <>
                        {(['jtf', 'mqf', 'egf', 'tdf', 'cvf', 'rif'] as const).map(factor => (
                          <td key={factor} className="px-3 py-2.5 text-center font-mono font-medium" style={{ color: 'var(--posi-text)' }}>
                            {score.subfactors[factor]}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-mono font-bold text-xs" style={{
                            color: score.grade === 'A+' || score.grade === 'A' ? '#1F7A4D'
                                 : score.grade === 'B+' || score.grade === 'B' ? 'var(--posi-primary)'
                                 : score.grade === 'C' ? '#B7791F'
                                 : 'var(--posi-muted)'
                          }}>
                            {score.total} · {score.grade}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={7} className="px-3 py-2.5 text-center text-[10px]" style={{ color: 'var(--posi-muted)' }}>
                        Assessment pending
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/journal/${j.journal_code}`}
                        className="text-[11px] hover:underline"
                        style={{ color: 'var(--posi-accent)' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--posi-muted)' }}>
          PQF subfactor scores shown. Full evidence records with source URLs are available on each Journal Detail page.
        </p>
      </div>

      {/* Aggregate evidence table */}
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Aggregate Evidence Status by PQF Factor</h2>

      {/* Evidence table by factor */}
      <div className="space-y-5">
        {EVIDENCE_CRITERIA.map(group => {
          const verified = group.criteria.filter(c => c.status === 'verified').length
          const partial  = group.criteria.filter(c => c.status === 'partial').length
          const missing  = group.criteria.filter(c => c.status === 'missing').length
          return (
            <section key={group.factor} className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
              <div className="flex items-center gap-3 px-5 py-3 justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', borderLeft: `4px solid ${group.color}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 leading-none" style={{ color: group.color, border: `1px solid ${group.color}` }}>
                    {group.factor}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--posi-text)' }}>{group.label}</span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono">
                  <span style={{ color: '#1F7A4D' }}>✓ {verified}</span>
                  <span style={{ color: '#B7791F' }}>◐ {partial}</span>
                  <span style={{ color: '#b91c1c' }}>✗ {missing}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
                      <th className="text-left px-5 py-2 font-semibold text-gray-500">Criterion</th>
                      <th className="text-center px-4 py-2 font-semibold text-gray-500 w-36">Status</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Evidence Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.criteria.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                        <td className="px-5 py-2.5 text-gray-700">{c.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-gray-50" style={{ border: '1px solid var(--posi-border)' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          Evidence status shown above reflects the aggregate state across PSG journals as of 2026-06-22.
          Individual journal evidence records are linked from each Journal Detail page.
          To report an incorrect evidence status, use the correction form on the relevant journal page or{' '}
          <Link href="/submit-journal" style={{ color: 'var(--posi-accent)' }} className="underline">contact the POSI team</Link>.
        </p>
        <p className="text-[11px] leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
          All evidence is based on publicly available information. POSI does not claim to have verified internal journal processes,
          manuscript handling, or reviewer conduct.
        </p>
      </div>

      <div className="mt-4 flex gap-4 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About & Governance →</Link>
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Data Sources →</Link>
      </div>
    </div>
  )
}
