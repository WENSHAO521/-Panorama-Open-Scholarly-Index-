import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Citation Visibility Index (CVI) | POSI',
  description: 'CVI measures whether a journal\'s citations are open, machine-readable, and tracked by open scholarly infrastructure including Crossref and OpenAlex.',
}

const CRITERIA = [
  { label: 'Crossref cited-by data detectable',                       pts: 2, note: 'Journal articles appear in Crossref cited-by API results' },
  { label: 'OpenAlex source record exists and matchable',             pts: 2, note: 'Journal matched to an OpenAlex Source record (ISSN-based)' },
  { label: 'OpenCitations data detectable',                           pts: 2, note: 'Planned — integration in progress; currently scored 0 for all' },
  { label: 'Open reference lists deposited via I4OC (Crossref)',      pts: 2, note: 'References publicly accessible under open license (CC0)' },
  { label: 'Citation data source clearly attributed in article page', pts: 2, note: 'Citation source identified and accessible to readers' },
]

const SOURCES = [
  { name: 'Crossref',        status: 'Live',    role: 'DOI-level citation tracking via cited-by API' },
  { name: 'OpenAlex',        status: 'Live',    role: 'Open knowledge graph; citation counts and source matching' },
  { name: 'OpenCitations',   status: 'Planned', role: 'CC0 open citation links; integration pending' },
  { name: 'I4OC',            status: 'Live',    role: 'Initiative for Open Citations — reference deposit compliance check' },
]

export default function CviPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/pqf" className="hover:text-gray-700">Assessment</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Citation Visibility Index</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>CVI</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>Citation Visibility · 0–10 points (CVF subfactor)</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Citation Visibility Index</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          CVI measures whether a journal's citations are open, machine-readable, and tracked by
          open scholarly infrastructure. It uses only open citation data — no proprietary
          citation counts from Web of Science, Scopus, or similar services.
        </p>
      </div>

      {/* Important notice */}
      <div className="p-4 text-xs leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <strong style={{ color: '#1d4ed8' }}>CVI is not a citation impact metric.</strong>
        <span style={{ color: '#1d4ed8' }}>
          {' '}CVI measures citation infrastructure readiness — whether citations are open and machine-readable.
          It does not measure citation frequency, h-index, or academic influence.
          High CVI means a journal participates in open citation standards; it does not mean the journal is highly cited.
        </span>
      </div>

      {/* Criteria */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>CVI Scoring Criteria</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>#</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Criterion</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Data Source</th>
              <th className="text-right px-5 py-2 font-semibold w-14" style={{ color: 'var(--posi-muted)' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-5 py-2.5 font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{i + 1}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--posi-text)' }}>{c.label}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--posi-muted)' }}>{c.note}</td>
                <td className="px-5 py-2.5 text-right font-mono font-bold" style={{ color: 'var(--posi-accent)' }}>{c.pts}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--posi-border)' }}>
              <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>Total (CVF subfactor)</td>
              <td className="px-5 py-2.5 text-right font-mono font-bold text-base" style={{ color: 'var(--posi-accent)' }}>10</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Data sources */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Citation Data Sources</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {SOURCES.map(s => (
            <div key={s.name} className="px-5 py-3 flex items-center gap-4">
              <span className="font-mono font-semibold text-xs w-32 shrink-0" style={{ color: 'var(--posi-text)' }}>{s.name}</span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 shrink-0"
                style={
                  s.status === 'Live'
                    ? { background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' }
                    : { background: '#fefce8', color: '#92400e', border: '1px solid #fde68a' }
                }
              >
                {s.status}
              </span>
              <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>{s.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Open citation principles */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Open Citation Principles</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Open Data Only', body: 'CVI uses exclusively open, CC0-licensed citation data. No proprietary citation databases (Web of Science, Scopus) are used in any part of POSI scoring.' },
            { title: 'Attribution Required', body: 'All citation data shown on POSI is attributed to its original source (Crossref, OpenAlex). POSI does not claim ownership of citation records.' },
            { title: 'Not Impact', body: 'CVI measures infrastructure participation, not academic quality. A journal scoring 10/10 CVI may have zero citations; a highly-cited journal may score 0 if citations are not open.' },
            { title: 'I4OC Compliance', body: 'POSI checks whether journals participate in the Initiative for Open Citations (I4OC) by depositing reference lists with Crossref under CC0. This enables open citation graphs.' },
          ].map(p => (
            <div key={p.title} className="border-l-2 pl-3" style={{ borderColor: 'var(--posi-border)' }}>
              <h3 className="text-xs font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{p.title}</h3>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/mqs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Metadata Quality Score →</Link>
        <Link href="/irs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Indexing Readiness Score →</Link>
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Data Sources →</Link>
      </div>

    </div>
  )
}
