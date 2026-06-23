import Link from 'next/link'
import { CheckCircle, Warning, Info, FileText, Clock, Envelope, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Journal | POSI',
  description: 'Submit an open access journal record to POSI for evidence review, PQF assessment, and metadata quality analysis.',
}

const ELIGIBILITY = [
  'Fully open access — no subscription paywall for readers',
  'All articles published under a Creative Commons license (CC BY, CC BY-SA, CC BY-NC, or equivalent)',
  'DOIs registered for all published articles via Crossref',
  'Peer review process documented and publicly disclosed',
  'Editorial board listed publicly with verifiable institutional affiliations',
  'APC and fee information publicly available (or explicit statement of no charges)',
  'Retraction and corrections policy publicly available',
  'Open access policy clearly stated per article',
]

const NOT_ELIGIBLE = [
  'Subscription-based or hybrid open access journals',
  'Journals without Crossref DOI registration',
  'Journals flagged on DOAJ\'s predatory journal criteria',
  'Journals with undisclosed or unverifiable editorial boards',
  'Single-issue, discontinued, or inactive journals',
  'Journals with no publicly accessible website',
]

const PROCESS_STEPS = [
  {
    step: '1',
    title: 'Self-Assessment',
    desc: 'Review the PQF Methodology and eligibility criteria. Complete a self-assessment using the PQF rubric to identify gaps before submitting. Journals that complete self-assessment tend to receive faster reviews.',
    link: { label: 'View PQF Methodology →', href: '/pqf' },
  },
  {
    step: '2',
    title: 'Prepare Documentation',
    desc: 'Gather the following before submitting: journal website URL, eISSN, Crossref member prefix, editorial board page URL, peer review policy URL, APC/fee page URL, open access policy URL, and corrections/retractions policy URL.',
  },
  {
    step: '3',
    title: 'Submit Application',
    desc: 'Email your application to posi@panorama-sg.com with subject line: "POSI Journal Submission: [Journal Title]". Include all documentation links and a brief description of the journal\'s scope.',
    link: { label: 'Send Application Email →', href: 'mailto:posi@panorama-sg.com?subject=POSI%20Journal%20Submission' },
  },
  {
    step: '4',
    title: 'Evidence Review',
    desc: 'The POSI review team will verify each PQF criterion against publicly available evidence. We may contact you for clarification on specific criteria. Target response time is 20 business days from receipt.',
  },
  {
    step: '5',
    title: 'Record Publication',
    desc: 'Accepted journals receive a public POSI Journal Record with a full PQF assessment, Metadata Quality Score, and Indexing Readiness Score. You will receive a detailed evidence report showing which criteria were met.',
  },
]

const REQUIRED_DOCS = [
  { field: 'Journal Title', detail: 'Full title and any abbreviated title' },
  { field: 'eISSN', detail: 'Electronic ISSN registered with ISSN International Centre' },
  { field: 'Journal Website', detail: 'URL to the public journal homepage' },
  { field: 'Crossref Member Prefix', detail: 'e.g. 10.XXXXX — required for DOI verification' },
  { field: 'Editorial Board URL', detail: 'Page listing editors with institutional affiliations' },
  { field: 'Peer Review Policy URL', detail: 'Page describing the review process and type' },
  { field: 'APC / Fee Information URL', detail: 'Page disclosing charges or confirming no APC' },
  { field: 'Open Access Policy URL', detail: 'Page with license terms and copyright policy' },
  { field: 'Corrections Policy URL', detail: 'Page describing retraction and correction procedures' },
  { field: 'OAI-PMH Endpoint', detail: 'If available — used for article-level metadata harvesting' },
]

export default function SubmitJournalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Submit Journal</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>
          Submit a Journal Record to POSI
        </h1>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI accepts applications from open access journal editors and publishers worldwide.
          Accepted records receive a public POSI Journal Record with full PQF assessment,
          Metadata Quality Score (MQS), and Indexing Readiness Score (IRS).
        </p>
      </div>

      {/* Status notice */}
      <div className="flex items-start gap-3 p-4" style={{ background: 'var(--posi-soft-blue)', border: '1px solid var(--posi-border)' }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--posi-primary)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-text)' }}>
          <strong>Early Access:</strong> POSI journal record review is currently free and open to qualifying open access journals.
          We prioritize journals with active Crossref DOI registration, complete editorial transparency, and DOAJ-eligible criteria.
          Journal records submitted by publishers who operate POSI (Panorama Scholarly Group) are subject to the same PQF criteria
          and include a conflict of interest disclosure.{' '}
          <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Read our governance policy →</Link>
        </p>
      </div>

      {/* Eligibility grid */}
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

      {/* Required documentation */}
      <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <FileText className="h-3.5 w-3.5" style={{ color: 'var(--posi-muted)' }} />
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            Required Documentation
          </h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'var(--posi-border-light)' } as React.CSSProperties}>
          {REQUIRED_DOCS.map((doc, i) => (
            <div key={i} className="px-5 py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="text-xs font-semibold w-52 shrink-0" style={{ color: 'var(--posi-text)' }}>
                {doc.field}
              </span>
              <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>{doc.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Process steps */}
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
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--posi-text)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{step.desc}</p>
                {step.link && (
                  <a
                    href={step.link.href}
                    className="inline-flex items-center gap-1 text-xs mt-2 hover:underline"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    {step.link.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review timeline */}
      <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" style={{ color: 'var(--posi-muted)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Review Timeline</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { phase: 'Acknowledgement', time: '2–3 business days', desc: 'Confirmation of receipt and initial eligibility check' },
            { phase: 'Evidence Review', time: '10–15 business days', desc: 'Full PQF criterion verification against public evidence' },
            { phase: 'Decision & Report', time: '3–5 business days', desc: 'Final decision with detailed evidence report sent to applicant' },
          ].map(p => (
            <div key={p.phase} className="p-3" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border-light)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--posi-text)' }}>{p.phase}</p>
              <p className="text-sm font-bold font-mono mb-1" style={{ color: 'var(--posi-accent)' }}>{p.time}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What happens after acceptance */}
      <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--posi-text)' }}>After Acceptance</h2>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, color: '#1F7A4D', title: 'Public Journal Record', desc: 'A permanent POSI Journal Record page is created with all metadata, ISSN, publisher information, and journal details.' },
            { icon: FileText, color: 'var(--posi-primary)', title: 'PQF Assessment Report', desc: 'A full PQF report showing scores for all six subfactors (JTF, MQF, EGF, TDF, CVF, RIF) with criterion-level evidence notes.' },
            { icon: ArrowRight, color: 'var(--posi-accent)', title: 'Metadata Quality Review', desc: 'Article-level MQS scoring based on DOI, abstract, ORCID, reference list, and license metadata completeness.' },
            { icon: ArrowRight, color: 'var(--posi-accent)', title: 'Annual Re-assessment', desc: 'Records are re-assessed annually. Journals may request an expedited review after documented improvements.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: item.color }} />
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit CTA */}
      <div className="p-6" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', borderLeft: '4px solid var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Envelope className="h-4 w-4" style={{ color: 'var(--posi-accent)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--posi-text)' }}>Submit Your Application</h2>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--posi-muted)' }}>
          Send your application to the address below with subject line:
          <strong style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)' }}> "POSI Journal Submission: [Journal Title]"</strong>.
          Attach or link all required documentation listed above. Incomplete submissions may delay review.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="mailto:posi@panorama-sg.com?subject=POSI%20Journal%20Submission"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--posi-accent)' }}
          >
            Send Application Email →
          </a>
          <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>posi@panorama-sg.com</span>
        </div>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          PQF Methodology →
        </Link>
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          Evidence Registry →
        </Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          Governance & COI Disclosure →
        </Link>
      </div>

    </div>
  )
}
