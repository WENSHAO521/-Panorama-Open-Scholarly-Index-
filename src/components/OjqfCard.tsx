import Link from 'next/link'
import type { PqfScore } from '@/lib/types'

const SUBFACTOR_META = [
  { key: 'jtf' as const, label: 'Journal Transparency Factor',  abbr: 'JTF', max: 25 },
  { key: 'mqf' as const, label: 'Metadata Quality Factor',      abbr: 'MQF', max: 25 },
  { key: 'egf' as const, label: 'Editorial Governance Factor',  abbr: 'EGF', max: 20 },
  { key: 'tdf' as const, label: 'Technical Discoverability',    abbr: 'TDF', max: 15 },
  { key: 'cvf' as const, label: 'Citation Visibility Factor',   abbr: 'CVF', max: 10 },
  { key: 'rif' as const, label: 'Research Integrity Factor',    abbr: 'RIF', max:  5 },
]

function gradeColor(grade: string) {
  if (grade === 'A+' || grade === 'A') return { color: '#1F7A4D' }
  if (grade === 'B+' || grade === 'B') return { color: 'var(--posi-primary)' }
  if (grade === 'C') return { color: '#B7791F' }
  return { color: 'var(--posi-muted)' }
}

function getSuggestions(score: PqfScore): string[] {
  const s = score.subfactors
  const tips: string[] = []
  if (s.jtf < 17) tips.push('Publish full editorial policies, APC/waiver details, retraction policy, and copyright terms publicly.')
  if (s.mqf < 18) tips.push('Register ORCID for all authors; deposit open reference lists with Crossref; include license URI in metadata.')
  if (s.egf < 14) tips.push('Disclose full editorial board with institutional affiliations, ORCID identifiers, and an AI use policy.')
  if (s.tdf < 10) tips.push('Enable OAI-PMH endpoint; add Schema.org JSON-LD and Google Scholar citation tags to article pages.')
  if (s.cvf < 5)  tips.push('Register reference lists with Crossref (I4OC) to enable open citation tracking via OpenCitations.')
  if (s.rif < 3)  tips.push('Publish a data availability policy, plagiarism detection statement, and ethics/informed consent policy.')
  if (score.total < 60) tips.push('Apply to DOAJ after meeting transparency criteria — this raises both TDF and JTF scores.')
  return tips.slice(0, 3)
}

interface PqfCardProps {
  score: PqfScore
  journalCode?: string
}

export function OjqfCard({ score, journalCode }: PqfCardProps) {
  const gc = gradeColor(score.grade)
  const suggestions = getSuggestions(score)

  return (
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)', borderTop: '4px solid var(--posi-accent)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 leading-none"
            style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}
          >
            PQF
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--posi-text)' }}>
            POSI Quality Factor
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>
            {score.version ?? 'PQF v1.0'}
          </span>
        </div>
        <Link href="/pqf" className="text-[11px] hover:underline transition-colors" style={{ color: 'var(--posi-accent)' }}>
          Methodology →
        </Link>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-6">
        {/* Score */}
        <div className="shrink-0 flex flex-col items-center justify-center w-28">
          <div className="text-5xl font-bold font-mono leading-none" style={gc}>
            {score.total}
          </div>
          <div
            className="mt-1 text-[11px] font-mono font-bold px-2 py-0.5"
            style={{ ...gc, border: `1px solid ${gc.color}` }}
          >
            Grade {score.grade}
          </div>
          <div className="mt-2 text-[10px] text-center" style={{ color: 'var(--posi-muted)' }}>
            / 100 · {score.evaluated_at}
          </div>
          <div className="mt-1 text-[10px] text-center" style={{ color: 'var(--posi-muted)' }}>
            PQF v1.0
          </div>
        </div>

        {/* Subfactor bars */}
        <div className="flex-1 space-y-2.5">
          {SUBFACTOR_META.map(sf => {
            const val = score.subfactors[sf.key] ?? 0
            const pct = Math.round((val / sf.max) * 100)
            return (
              <div key={sf.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold w-7" style={{ color: 'var(--posi-muted)' }}>{sf.abbr}</span>
                    <span className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>{sf.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--posi-text)' }}>
                    {val}<span style={{ color: 'var(--posi-border)' }}>/{sf.max}</span>
                  </span>
                </div>
                <div className="w-full h-1.5" style={{ background: 'var(--posi-bg)' }}>
                  <div
                    className="h-1.5 transition-all"
                    style={{ width: `${pct}%`, background: 'var(--posi-accent)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Evidence link */}
      <div className="px-5 py-2.5 flex items-center gap-4" style={{ borderTop: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
        <Link href="/evidence" className="text-[11px] hover:underline transition-colors" style={{ color: 'var(--posi-accent)' }}>
          View evidence →
        </Link>
        <Link href="/pqf" className="text-[11px] hover:underline transition-colors" style={{ color: 'var(--posi-accent)' }}>
          View methodology →
        </Link>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--posi-muted)' }}>
            Improvement Suggestions
          </p>
          <ul className="space-y-1">
            {suggestions.map((tip, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                <span className="shrink-0 font-mono" style={{ color: 'var(--posi-accent)' }}>→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--posi-border-light)', background: '#fffbeb' }}>
        <p className="text-[10px] leading-relaxed" style={{ color: '#92400e' }}>
          PQF is not a Journal Impact Factor and should not be used as a substitute for expert review, article-level
          assessment, researcher evaluation, institutional ranking, or funding decisions. Some journals evaluated here
          are published by Panorama Scholarly Group, which also operates POSI.{' '}
          <Link href="/about" className="underline">Conflict of interest disclosure →</Link>
        </p>
      </div>
    </div>
  )
}

// Named export alias for new code
export { OjqfCard as PqfCard }
