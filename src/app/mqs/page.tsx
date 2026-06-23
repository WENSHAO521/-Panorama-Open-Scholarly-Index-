import Link from 'next/link'
import type { Metadata } from 'next'
import { ALL_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Metadata Quality Score (MQS) | POSI',
  description: 'MQS is a 0–100 article-level metadata completeness score measuring DOI, abstract, ORCID, references, license, and full-text availability.',
}

const CRITERIA = [
  { label: 'DOI registered with Crossref for all articles',                pts: 4, note: 'Minimum requirement for POSI article metadata' },
  { label: 'Crossref metadata complete (title, author, publication date)', pts: 4, note: 'Required for discoverability in all major indexes' },
  { label: 'Author names structured (given name + family name)',           pts: 3, note: 'Required for citation disambiguation' },
  { label: 'ORCID supplied for at least one author per article',           pts: 3, note: 'Open researcher identifier, enables author disambiguation' },
  { label: 'Abstract and keywords present in metadata record',             pts: 3, note: 'Required for search engine indexing and topic classification' },
  { label: 'Reference list deposited with Crossref and parseable',         pts: 3, note: 'Enables open citation tracking via I4OC participation' },
  { label: 'License URI present in Crossref metadata record',              pts: 2, note: 'Machine-readable license required for text mining reuse' },
  { label: 'PDF or HTML full-text link stable and accessible',             pts: 2, note: 'Required for content-level discoverability' },
  { label: 'Article type clearly identified (research/review/editorial)',  pts: 1, note: 'Enables article type filtering in indexes' },
]

const BANDS = [
  { range: '85–100', label: 'Excellent',     color: '#1F7A4D', desc: 'Near-complete metadata; eligible for major scholarly indexes' },
  { range: '70–84',  label: 'Good',          color: '#1e3a5f', desc: 'Strong metadata coverage with minor gaps' },
  { range: '55–69',  label: 'Satisfactory',  color: '#B7791F', desc: 'Core fields present; ORCID and references often missing' },
  { range: '40–54',  label: 'Developing',    color: '#B7791F', desc: 'DOI registered but metadata completeness needs improvement' },
  { range: '< 40',   label: 'Insufficient',  color: '#9CA3AF', desc: 'Critical metadata fields missing; not indexing-ready' },
]

export default function MqsPage() {
  const verifiedJournals = ALL_JOURNALS.filter(j => !j.id.startsWith('j-disc-') && j.metadata_quality_score)
  const avgMqs = verifiedJournals.length
    ? Math.round(verifiedJournals.reduce((s, j) => s + j.metadata_quality_score, 0) / verifiedJournals.length)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/pqf" className="hover:text-gray-700">Assessment</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Metadata Quality Score</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>MQS</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>Article-level · 0–25 points (MQF subfactor)</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Metadata Quality Score</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          MQS measures the completeness of article-level metadata across nine criteria, scored out of 25.
          It is one of six components that make up the POSI Quality Framework (PQF), weighted at 25%.
          MQS is based entirely on publicly verifiable metadata fields.
        </p>
      </div>

      {/* What MQS measures */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>What MQS Measures</h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          MQS evaluates whether a journal's articles have the metadata fields required for scholarly discoverability,
          citation tracking, author disambiguation, and open text mining. All criteria are checked against
          Crossref metadata records and public article pages. No proprietary databases are used.
        </p>
        <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
          MQS is a journal-level aggregate: each criterion is evaluated across a sample of recent articles
          and scored proportionally. A journal scores full points for a criterion when all sampled articles satisfy it.
        </p>
      </section>

      {/* Platform average */}
      <div className="grid grid-cols-3 gap-px" style={{ border: '1px solid var(--posi-border)', background: 'var(--posi-border)' }}>
        {[
          { value: '25', label: 'Maximum MQS Points', note: 'MQF subfactor weight in PQF' },
          { value: `${avgMqs}`, label: 'Platform Average MQS', note: `Across ${verifiedJournals.length} verified journal records` },
          { value: '9', label: 'Scored Criteria', note: 'All based on Crossref + public article pages' },
        ].map(s => (
          <div key={s.label} className="bg-white px-5 py-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] mt-1" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--posi-border-light)' }}>{s.note}</p>
          </div>
        ))}
      </div>

      {/* Criteria table */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Scoring Criteria</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>#</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Criterion</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Rationale</th>
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
              <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>Total (MQF subfactor)</td>
              <td className="px-5 py-2.5 text-right font-mono font-bold text-base" style={{ color: 'var(--posi-accent)' }}>25</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Score bands */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>MQS Score Bands</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {BANDS.map(b => (
            <div key={b.range} className="px-5 py-3 flex items-center gap-4">
              <span className="font-mono font-bold text-sm w-20 shrink-0" style={{ color: b.color }}>{b.range}</span>
              <span className="font-semibold text-xs w-28 shrink-0" style={{ color: b.color }}>{b.label}</span>
              <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>{b.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/cvi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Visibility Index →</Link>
        <Link href="/irs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Indexing Readiness Score →</Link>
      </div>

    </div>
  )
}
