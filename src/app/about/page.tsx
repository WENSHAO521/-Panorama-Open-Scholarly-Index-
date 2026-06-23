import Link from 'next/link'

export const metadata = {
  title: 'About POSI | Panorama Open Scholarly Index',
  description: 'About the Panorama Open Scholarly Index (POSI) — an open scholarly metadata platform for journal transparency and metadata quality.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <nav className="text-xs flex items-center gap-1.5 mb-5" style={{ color: 'var(--posi-muted)' }}>
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--posi-text)' }}>About</span>
        </nav>
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--posi-text)' }}>About POSI</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 tracking-wide" style={{ background: 'var(--posi-accent)', color: '#fff' }}>
            v2.0
          </span>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          The Panorama Open Scholarly Index (POSI) is an open scholarly metadata platform
          for journal transparency, metadata quality, technical discoverability, and open citation visibility.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Mission</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
          POSI exists to make scholarly publishing infrastructure more transparent and machine-readable.
          We aggregate openly licensed metadata from multiple sources, apply structured quality assessments,
          and publish the results freely under CC BY 4.0. Our goal is to help researchers, librarians,
          and institutions make better-informed decisions about where to publish and what to cite —
          without replacing or competing with established indexing services.
        </p>
      </div>

      {/* What POSI is / is not */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is</h2>
          <ul className="space-y-2">
            {[
              'An open metadata aggregation platform',
              'A metadata quality assessment tool (PQF)',
              'A discoverability layer for PSG-affiliated journals',
              'A freely reusable dataset under CC BY 4.0',
              'A research transparency initiative',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>What POSI Is Not</h2>
          <ul className="space-y-2">
            {[
              'A replacement for Web of Science or Scopus',
              'An Impact Factor or citation ranking service',
              'A DOAJ-equivalent accreditation body',
              'A peer review certifier or article validator',
              'An endorsement of any journal\'s scientific content',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#c41e3a' }}>✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conflict of interest */}
      <div className="p-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: '#92400E' }}>Conflict of Interest Disclosure</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#78350F' }}>
          POSI is operated by Panorama Scholarly Group Ltd. (PSG). The majority of journals currently
          recorded in POSI are PSG-affiliated publications. PSG editors, staff, and affiliates may have
          a financial or reputational interest in the journals evaluated. All PQF scores are assigned
          using documented, publicly available criteria. Users should account for this relationship
          when interpreting scores and should not use POSI ratings as the sole basis for publication
          or citation decisions.
        </p>
      </div>

      {/* Operator */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--posi-text)' }}>Operator</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-xs" style={{ color: 'var(--posi-muted)' }}>
          <div className="space-y-1">
            <p className="font-semibold" style={{ color: 'var(--posi-text)' }}>Panorama Scholarly Group Ltd.</p>
            <p>Room 1508, 15/F., Office Tower Two</p>
            <p>Grand Plaza, 625 Nathan Road</p>
            <p>Kowloon, Hong Kong</p>
          </div>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Record review &amp; submissions: </span>
              <a href="mailto:posi@panorama-sg.com" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
                posi@panorama-sg.com
              </a>
            </p>
            <p>
              <span className="font-medium">Website: </span>
              <a href="https://panorama-sg.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
                panorama-sg.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Data & Methodology */}
      <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-base font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Data &amp; Methodology</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>
          POSI aggregates metadata from openly licensed third-party infrastructure providers including
          Crossref, OpenAlex, DOAJ, OpenCitations, ROR, and ORCID. Source identifiers and provenance
          are preserved wherever available.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { label: 'PQF Methodology', href: '/pqf' },
            { label: 'Evidence Registry', href: '/evidence' },
            { label: 'Data Sources', href: '/data-sources' },
            { label: 'API & Export', href: '/api' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 font-medium transition-colors hover:text-white hover:bg-[#c41e3a]"
              style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-accent)' }}
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </div>

      {/* License */}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        <p>
          All curated metadata published by POSI is freely available for reuse under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--posi-accent)' }}
          >
            Creative Commons Attribution 4.0 International (CC BY 4.0)
          </a>
          . Third-party metadata remains attributed to its original source.
          POSI is not affiliated with Web of Science, Scopus, Clarivate, Elsevier, or DOAJ.
        </p>
      </div>
    </div>
  )
}
