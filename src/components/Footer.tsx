import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ background: 'var(--posi-primary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-8 lg:gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/posi-logo-white.svg"
              alt="POSI - Panorama Scholarly Index"
              style={{ height: '52px', width: 'auto', marginBottom: '20px' }}
            />
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Open scholarly metadata platform for journal transparency, metadata quality,
              and citation visibility. Not affiliated with Web of Science, Scopus, or DOAJ.
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 text-white"
                style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              >
                Open Access
              </span>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-0.5 transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                CC BY 4.0
              </a>
            </div>
          </div>

          {/* Platform links — two sub-columns to keep height compact */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
            >
              Platform
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { href: '/search',         label: 'Search' },
                { href: '/journals',       label: 'Journals' },
                { href: '/articles',       label: 'Articles' },
                { href: '/doi-lookup',     label: 'DOI Lookup' },
                { href: '/pqf',            label: 'PQF' },
                { href: '/evidence',       label: 'Evidence' },
                { href: '/data-sources',   label: 'Data Sources' },
                { href: '/api',            label: 'API' },
                { href: '/submit-journal', label: 'Submit' },
                { href: '/policy',         label: 'Policy' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Open Infrastructure */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
            >
              Open Infrastructure
            </p>
            <ul className="space-y-3">
              {[
                { href: 'https://crossref.org',      label: 'Crossref' },
                { href: 'https://openalex.org',      label: 'OpenAlex' },
                { href: 'https://opencitations.net', label: 'OpenCitations' },
                { href: 'https://doaj.org',          label: 'DOAJ' },
                { href: 'https://ror.org',           label: 'ROR' },
                { href: 'https://orcid.org',         label: 'ORCID' },
              ].map(src => (
                <li key={src.href}>
                  <a
                    href={src.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}
                  >
                    {src.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.18em] mb-5"
              style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
            >
              Contact
            </p>
            <div className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Room 1508, Office Tower Two<br />
                Grand Plaza, 625 Nathan Road<br />
                Kowloon, Hong Kong
              </p>
              <div>
                <a
                  href="mailto:posi@panorama-sg.com"
                  className="text-xs transition-colors hover:text-white block"
                  style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}
                >
                  posi@panorama-sg.com
                </a>
                <span
                  className="text-[10px] mt-0.5 block"
                  style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}
                >
                  Indexing &amp; submissions
                </span>
              </div>
              <a
                href="https://panorama-sg.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}
              >
                panorama-sg.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p
            className="text-[10px]"
            style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}
          >
            &copy; {new Date().getFullYear()} Panorama Scholarly Group. Curated metadata freely available for reuse.
          </p>
          <Link
            href="/about"
            className="text-[10px] transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
          >
            Conflict of Interest Disclosure
          </Link>
        </div>
      </div>
    </footer>
  )
}
