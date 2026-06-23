import Link from 'next/link'
import { CheckCircle, Warning, Info } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Submit Journal',
  description: 'Information for journal editors who wish to submit a journal record to POSI for review.',
}

const ELIGIBILITY = [
  'Journal is fully open access (no subscription paywall for readers)',
  'All articles published under a Creative Commons license (CC BY, CC BY-SA, CC BY-NC, or equivalent)',
  'DOIs registered for all published articles via Crossref',
  'Peer review process documented and publicly disclosed',
  'Editorial board with verifiable institutional affiliations',
  'Clear retraction and corrections policy',
  'Open access policy and fee information publicly available',
]

const NOT_ELIGIBLE = [
  'Subscription-based or hybrid journals',
  'Journals without Crossref DOI registration',
  'Predatory journals (see DOAJ criteria)',
  'Journals with undisclosed editorial board',
  'Single-issue or discontinued journals',
]

const PROCESS_STEPS = [
  {
    step: '1',
    title: 'Self-Assessment',
    desc: 'Review the eligibility criteria and PQF subfactors. Complete a self-assessment to identify areas for improvement before submitting.',
  },
  {
    step: '2',
    title: 'Prepare Documentation',
    desc: 'Gather your journal website URL, ISSN, Crossref member information, editorial board list, peer review documentation, and open access policy.',
  },
  {
    step: '3',
    title: 'Submit Application',
    desc: 'Email your submission to the address below with subject line "POSI Journal Submission: [Journal Title]". Include all required documentation.',
  },
  {
    step: '4',
    title: 'POSI Review',
    desc: 'Our editorial team will review your application against PQF criteria and respond within 20 business days. We may request additional information.',
  },
  {
    step: '5',
    title: 'Record Approval',
    desc: 'Accepted journal records receive a POSI profile and, where sufficient evidence is available, a PQF assessment and metadata quality review. You will receive a detailed report.',
  },
]

export default function SubmitJournalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <nav className="text-xs flex items-center gap-1.5 mb-5" style={{ color: 'var(--posi-muted)' }}>
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--posi-text)' }}>Submit Journal</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>Submit a Journal Record for POSI Review</h1>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI accepts applications from open access journal editors and publishers.
          Accepted records receive a public POSI journal profile and may become eligible for PQF assessment,
          metadata quality review, and citation visibility analysis.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4" style={{ background: 'var(--posi-soft-blue)', border: '1px solid var(--posi-border)' }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--posi-primary)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-text)' }}>
          POSI is currently in early access. POSI record review is currently free and open to qualifying open access journals.
          We prioritize journals with active Crossref DOI registration, complete editorial transparency, and DOAJ-eligible criteria.
        </p>
      </div>

      {/* Eligibility */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-4 w-4" style={{ color: '#1F7A4D' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Eligibility Criteria</h2>
          </div>
          <ul className="space-y-2.5">
            {ELIGIBILITY.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: '#1F7A4D' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Warning className="h-4 w-4" style={{ color: 'var(--posi-danger)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Not Currently Eligible</h2>
          </div>
          <ul className="space-y-2.5">
            {NOT_ELIGIBLE.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: 'var(--posi-danger)' }}>✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Process */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--posi-text)' }}>Submission Process</h2>
        <div className="space-y-3">
          {PROCESS_STEPS.map(step => (
            <div key={step.step} className="bg-white flex gap-4 p-4" style={{ border: '1px solid var(--posi-border)' }}>
              <div
                className="w-7 h-7 shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--posi-accent)', borderRadius: '50%' }}
              >
                {step.step}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="p-6" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--posi-text)' }}>Submit Your Application</h2>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--posi-muted)' }}>
          Send your application email to the address below. Include the following in your message:
          journal title, ISSN/eISSN, journal website, Crossref membership status, brief description,
          and editorial board information.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="mailto:posi@panorama-sg.com?subject=POSI%20Journal%20Submission"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--posi-accent)' }}
          >
            Submit via Email →
          </a>
          <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>posi@panorama-sg.com</span>
        </div>
      </div>

      {/* OJQF reference */}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        <p>
          All accepted journals are evaluated using the{' '}
          <Link href="/pqf" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
            POSI Quality Framework (PQF)
          </Link>{' '}
          methodology. Review the methodology page to understand how journals are assessed before applying.
        </p>
      </div>
    </div>
  )
}
