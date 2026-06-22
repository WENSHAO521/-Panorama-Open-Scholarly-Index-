#!/usr/bin/env node
// One-time script: splits DISCOVERED_JOURNALS out of data.ts into discovered-journals.ts
// After running, delete this file.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_FILE       = join(__dir, '../src/lib/data.ts')
const DISCOVERED_FILE = join(__dir, '../src/lib/discovered-journals.ts')

console.log('Reading data.ts...')
const src = readFileSync(DATA_FILE, 'utf8')

// Split on the Extended Records comment block
const DISC_START = '\n// ── Extended Records (unverified metadata records) ────────────────────────'
const AFTER_DISC = '\nexport const ALL_JOURNALS'

const startIdx = src.indexOf(DISC_START)
const endIdx   = src.indexOf(AFTER_DISC)

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: Could not find split markers')
  process.exit(1)
}

const beforeSection = src.slice(0, startIdx)
const discSection   = src.slice(startIdx + 1, endIdx) // skip leading \n; ends before ALL_JOURNALS
const afterSection  = src.slice(endIdx)

// Build discovered-journals.ts
const discoveredTs = `// @ts-nocheck
// Auto-generated — do not edit manually.
// Run: node scripts/discover-journals.mjs --openalex-doaj --write
import type { Journal } from './types'

function autopqf(jtf, mqf, egf, tdf, cvf, rif) {
  const total = jtf + mqf + egf + tdf + cvf + rif
  const grade = total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 70 ? 'B+' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 40 ? 'D' : 'E'
  return { total, grade, subfactors: { jtf, mqf, egf, tdf, cvf, rif }, evaluated_at: '2026-06-22', version: 'PQF v1.0-auto' }
}

${discSection}
`

// Build updated data.ts
const newDataTs = `${beforeSection}
export { DISCOVERED_JOURNALS } from './discovered-journals'
${afterSection}`

console.log('Writing discovered-journals.ts...')
writeFileSync(DISCOVERED_FILE, discoveredTs, 'utf8')

console.log('Writing updated data.ts...')
writeFileSync(DATA_FILE, newDataTs, 'utf8')

console.log('Done!')
console.log(`  discovered-journals.ts: ${(discoveredTs.length / 1e6).toFixed(1)} MB`)
console.log(`  data.ts: ${(newDataTs.length / 1e6).toFixed(1)} MB`)
