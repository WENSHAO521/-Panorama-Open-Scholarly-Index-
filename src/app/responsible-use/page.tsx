import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Responsible Use Notice | POSI',
  description: 'How POSI data and PQF scores should and should not be used. POSI is a transparency and metadata readiness platform, not an indexing service or impact metric provider.',
}

const PERMITTED = [
  { use: 'Journal metadata lookup and verification', detail: 'Use POSI to look up ISSN, publisher, DOI registration status, and OA license for any listed journal.' },
  { use: 'Metadata quality benchmarking', detail: 'Use MQS to identify gaps in DOI, ORCID, reference lists, and license metadata for improvement purposes.' },
  { use: 'Technical discoverability assessment', detail: 'Use IRS to identify OAI-PMH, sitemap, or Schema.org gaps that prevent aggregator indexing.' },
  { use: 'Policy transparency review', detail: 'Use Policy Evidence Directory and Evidence Registry to verify whether a journal has publicly stated policies on peer review, APC, retraction, and ethics.' },
  { use: 'Open citation infrastructure check', detail: 'Use CVI to check whether a journal participates in open citation standards (I4OC, Crossref deposit, OpenAlex matching).' },
  { use: 'Research on journal transparency', detail: 'POSI data may be used under CC BY 4.0 for academic research into journal metadata quality and policy transparency.' },
]

const PROHIBITED = [
  { use: 'Researcher evaluation or hiring decisions', detail: 'PQF scores indicate journal metadata infrastructure, not research quality. Never use PQF to evaluate individual researchers, assign publication points, or make hiring decisions.' },
  { use: 'Promotion or tenure criteria', detail: 'PQF is not an accreditation or prestige metric. It must not be used as a proxy for journal standing in academic evaluation contexts.' },
  { use: 'Funding allocation', detail: 'PQF scores must not be used as criteria for awarding grants, fellowships, or research funding.' },
  { use: 'Institutional ranking', detail: 'POSI does not rank institutions. Using POSI journal lists to rank universities, departments, or research groups is not an intended or supported use.' },
  { use: 'Replacement for DOAJ, Web of Science, or Scopus', detail: 'POSI is not an indexing service. A high PQF score does not mean a journal is indexed by Web of Science, Scopus, or DOAJ. Check those services directly.' },
  { use: 'Endorsement of scholarly quality', detail: 'PQF assesses transparency and metadata readiness, not peer review rigour, editorial quality, or academic prestige. Do not interpret PQF as an endorsement of article-level quality.' },
]

export default function ResponsibleUsePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Responsible Use Notice</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Responsible Use Notice</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI is an open scholarly metadata and transparency assessment platform.
          Understanding what POSI is — and is not — is essential for responsible use of its data.
        </p>
      </div>

      {/* What POSI is */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is</h2>
        <ul className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          {[
            'An open metadata platform aggregating journal records from Crossref, OpenAlex, DOAJ, and OAI-PMH sources.',
            'A transparency assessment tool measuring publicly verifiable journal policies and metadata quality.',
            'A tool for editors and publishers to identify gaps in metadata completeness and technical discoverability.',
            'A research resource for studying open access journal infrastructure and policy transparency.',
            'A conflict-of-interest-disclosed platform operated by Panorama Scholarly Group.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* What POSI is not */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is Not</h2>
        <ul className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          {[
            'An indexing service. Being listed in POSI does not mean a journal is indexed by Web of Science, Scopus, DOAJ, or any other database.',
            'A peer review quality evaluator. PQF does not assess the rigour or independence of peer review conducted at a journal.',
            'A citation impact metric. PQF and CVI do not measure how often a journal is cited.',
            'An official accreditation body. POSI has no authority over journal recognition, institutional policy, or academic evaluation systems.',
            'An independent third-party evaluator for PSG journals. POSI is operated by Panorama Scholarly Group, which also publishes journals listed in POSI.',
            'A replacement for librarian judgment. POSI data should supplement, not replace, professional library and information science evaluation.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: 'var(--posi-danger)' }}>✗</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Permitted uses */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Permitted Uses</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {PERMITTED.map((item, i) => (
            <div key={i} className="px-5 py-3">
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>{item.use}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prohibited uses */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: '#fef2f2' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: '#9B1C1C' }}>Prohibited Uses</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {PROHIBITED.map((item, i) => (
            <div key={i} className="px-5 py-3">
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>{item.use}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Citation */}
      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Citing POSI Data</h2>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>
          POSI metadata is available under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
            CC BY 4.0
          </a>.
          When citing POSI data, please attribute the original data sources (Crossref, OpenAlex, DOAJ) as shown in each record's provenance fields.
        </p>
        <div className="p-3 font-mono text-[11px] leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
          Panorama Open Scholarly Index (POSI). "Journal Record: [Title]." posi.panorama-sg.com.
          Accessed [Date]. Data sourced from Crossref, OpenAlex, and DOAJ under CC0 1.0.
        </div>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/coi" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Conflict of Interest Disclosure →</Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About POSI →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
      </div>

    </div>
  )
}
