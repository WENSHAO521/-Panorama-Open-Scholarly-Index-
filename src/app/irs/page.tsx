import Link from 'next/link'
import type { Metadata } from 'next'
import { ALL_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Indexing Readiness Score (IRS) | POSI',
  description: 'IRS assesses the technical readiness of a journal for discovery by scholarly search engines, aggregators, and major indexing services.',
}

const CRITERIA = [
  { label: 'sitemap.xml accessible, valid, and up to date',                    pts: 2, note: 'Required for all major search engine crawlers' },
  { label: 'robots.txt permits academic crawlers (Googlebot, CrossrefBot)',    pts: 2, note: 'Blocking academic bots reduces indexing reach' },
  { label: 'OAI-PMH endpoint active and returns valid Dublin Core records',    pts: 3, note: 'Standard metadata harvesting protocol; required by many aggregators' },
  { label: 'Schema.org JSON-LD structured data on article pages',              pts: 2, note: 'Enables Google Scholar, Bing Academic, and rich search results' },
  { label: 'Google Scholar citation meta tags on article pages',               pts: 2, note: 'Highwire Press / PRISM tags for Google Scholar indexing' },
  { label: 'DOI links resolve correctly (< 5% broken DOIs)',                   pts: 2, note: 'Broken DOIs prevent citation tracking and reader access' },
  { label: 'Journal pages accessible without broken links or 404 errors',     pts: 2, note: 'Stable URL structure required for persistent discoverability' },
]

const GRADES = [
  { grade: 'A', range: '13–15', color: '#1F7A4D', desc: 'Full technical readiness; eligible for all major aggregators' },
  { grade: 'B', range: '10–12', color: '#1e3a5f', desc: 'Strong readiness; minor gaps in Schema.org or OAI-PMH' },
  { grade: 'C', range: '7–9',   color: '#B7791F', desc: 'Developing; OAI-PMH or sitemap issues present' },
  { grade: 'D', range: '< 7',   color: '#9CA3AF', desc: 'Early stage; significant technical barriers to indexing' },
]

export default function IrsPage() {
  const verifiedJournals = ALL_JOURNALS.filter(j => !j.id.startsWith('j-disc-') && j.indexing_readiness)
  const gradeCount = verifiedJournals.reduce((acc, j) => {
    const g = j.indexing_readiness || 'D'
    acc[g] = (acc[g] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/pqf" className="hover:text-gray-700">Assessment</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Indexing Readiness Score</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>IRS</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>Technical Readiness · 0–15 points (TDF subfactor)</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Indexing Readiness Score</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          IRS evaluates the technical infrastructure of a journal's website for academic discovery.
          It assesses OAI-PMH availability, sitemap structure, DOI resolution health, and metadata
          standards used for Google Scholar, Crossref, and aggregator indexing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px" style={{ border: '1px solid var(--posi-border)', background: 'var(--posi-border)' }}>
        {GRADES.map(g => (
          <div key={g.grade} className="bg-white px-4 py-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: g.color }}>
              {gradeCount[g.grade] || 0}
            </p>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: g.color }}>{g.grade}</p>
            <p className="text-[9px] uppercase tracking-[0.1em] mt-1" style={{ color: 'var(--posi-muted)' }}>
              {g.range} pts
            </p>
          </div>
        ))}
      </div>

      {/* Criteria table */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>IRS Scoring Criteria</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2 font-semibold w-8" style={{ color: 'var(--posi-muted)' }}>#</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Criterion</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--posi-muted)' }}>Why It Matters</th>
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
              <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>Total (TDF subfactor)</td>
              <td className="px-5 py-2.5 text-right font-mono font-bold text-base" style={{ color: 'var(--posi-accent)' }}>15</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Grade descriptions */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>IRS Grade Scale</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {GRADES.map(g => (
            <div key={g.grade} className="px-5 py-3 flex items-center gap-4">
              <span className="font-mono font-bold text-xl w-8 shrink-0" style={{ color: g.color }}>{g.grade}</span>
              <span className="font-mono text-xs w-16 shrink-0" style={{ color: 'var(--posi-muted)' }}>{g.range} pts</span>
              <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>{g.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How IRS is assessed */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>How IRS Is Assessed</h2>
        <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          <p>IRS is checked via automated crawls and manual verification of journal websites. The OAI-PMH endpoint is tested using the official OAI-PMH validator protocol. Sitemap validity is checked against the Sitemaps.org schema.</p>
          <p>Google Scholar meta tags are checked against the Highwire Press citation_title / citation_doi standard. Schema.org JSON-LD is checked for ScholarlyArticle type markup on article pages.</p>
          <p>DOI resolution is sampled across recently published articles. A journal with more than 5% unresolvable DOIs receives 0 points for that criterion.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/mqs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Metadata Quality Score →</Link>
        <Link href="/cvi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Visibility Index →</Link>
      </div>

    </div>
  )
}
