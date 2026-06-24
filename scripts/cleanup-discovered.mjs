#!/usr/bin/env node
/**
 * Cleanup script for Auto-discovered journals (not_listed group).
 *
 * Actions:
 *  1. Fix MDPI journals actually in DOAJ → change doaj_status to "listed"
 *  2. Remove defunct / discontinued journals
 *  3. Remove conference proceedings & book series (not journals)
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(__dirname, '../src/lib/discovered-journals.ts')

// ── IDs to fix: change doaj_status 'not_listed' → "listed" ──────────────────
const FIX_TO_LISTED = new Set([
  'j-disc-water',                         // Water (MDPI) — in DOAJ
  'j-disc-international-journal-of',      // IJMS / IJERPH etc. — handled by ISSN match below
  'j-disc-forests',                       // Forests (MDPI)
  'j-disc-symmetry',                      // Symmetry (MDPI)
  'j-disc-journal-of-clinical-medi',     // Journal of Clinical Medicine (MDPI)
])

// ISSNs to specifically fix (more reliable than ID prefix match)
const FIX_ISSNS = new Set([
  '2073-4441',  // Water
  '1422-0067',  // International Journal of Molecular Sciences
  '1660-4601',  // International Journal of Environmental Research and Public Health
  '1999-4907',  // Forests
  '2073-8994',  // Symmetry
  '2077-0383',  // Journal of Clinical Medicine
])

// ── IDs to remove: defunct / discontinued journals ───────────────────────────
const REMOVE_IDS = new Set([
  // ISRN (Hindawi) — entire series discontinued ~2014
  'j-disc-isrn-cardiology',
  'j-disc-isrn-high-energy-physics',
  'j-disc-isrn-pediatrics',
  'j-disc-isrn-mathematical-analys',
  // Frontiers discontinued
  'j-disc-frontiers-in-neuroengine',   // Frontiers in Neuroengineering
  'j-disc-frontiers-in-neuroenerge',   // Frontiers in Neuroenergetics
  // Other defunct
  'j-disc-plos-currents',              // PLoS Currents — closed 2017
  'j-disc-peerj-organic-chemistry',   // PeerJ Organic Chemistry — discontinued
  'j-disc-eearth-discussions',         // eEarth Discussions — EGU, closed
  'j-disc-pathology-research-inter',  // Pathology Research International — closed
  'j-disc-stephan-mueller-special-',  // Stephan Mueller Special Publication — book series
  'j-disc-atmospheric-chemistry-an',  // ACP Discussions — replaced by final article stream
])

// ── ISSNs to remove: conference proceedings / book series ───────────────────
const REMOVE_ISSNS = new Set([
  '2570-2092',  // Proceedings of the ICA
  '2570-2106',  // Abstracts of the ICA
  '2570-2084',  // Advances in Cartography and GIScience of the ICA
  '2700-8150',  // AGILE GIScience Series
  '2749-4802',  // Safety of Nuclear Waste Disposal (symposium)
])

// ────────────────────────────────────────────────────────────────────────────

let src = await readFile(FILE, 'utf8')
const originalLen = src.length

// Split on journal object boundaries. Each journal block starts with `  {` and
// ends just before the next `  {` or the closing `]`.
// Strategy: work on the raw text, find each `id:` line and check whether to
// remove / fix the surrounding object.

// We process journal entries as text blocks delimited by `  {` … `  },`
// The file looks like:
//   export const DISCOVERED_JOURNALS: Journal[] = [
//     { id: '...', ... },
//     { id: '...', ... },
//   ]

let removedCount = 0
let fixedCount = 0

// Match each journal object as a text block (greedy, balanced)
// We use a simple approach: split the file into the array body and process entries
const arrayStart = src.indexOf('= [')
const arrayEnd   = src.lastIndexOf(']')
const prefix = src.slice(0, arrayStart + 3)   // everything up to and including `= [`
const suffix = src.slice(arrayEnd)             // `]` and everything after (export etc.)
let body   = src.slice(arrayStart + 3, arrayEnd)

// Split into individual journal blocks. Each starts at `\n  {` and ends at `\n  },` or `\n  }`
const entryRe = /\n  \{[\s\S]*?\n  \},?/g
const entries = []
let m
while ((m = entryRe.exec(body)) !== null) {
  entries.push(m[0])
}

const kept = []
for (const entry of entries) {
  // Extract the id field
  const idMatch = entry.match(/\bid:\s*['"]([^'"]+)['"]/)
  const issnMatch = entry.match(/\bissn_online:\s*['"]([^'"]+)['"]/)
    ?? entry.match(/\bissn_print:\s*['"]([^'"]+)['"]/)
  const id   = idMatch?.[1] ?? ''
  const issn = issnMatch?.[1] ?? ''

  // Check remove by ID prefix
  const removeByIdPrefix = [...REMOVE_IDS].some(rid => id.startsWith(rid))
  // Check remove by ISSN
  const removeByIssn = REMOVE_ISSNS.has(issn)

  if (removeByIdPrefix || removeByIssn) {
    removedCount++
    continue
  }

  // Check fix: ISSN-based is most reliable
  if (FIX_ISSNS.has(issn)) {
    const fixed = entry.replace(/doaj_status:\s*'not_listed'/, 'doaj_status: "listed"')
    kept.push(fixed)
    if (fixed !== entry) fixedCount++
    continue
  }

  kept.push(entry)
}

const newBody = kept.join('')
const newSrc  = prefix + newBody + suffix

await writeFile(FILE, newSrc, 'utf8')

console.log(`Done.`)
console.log(`  Removed:  ${removedCount} entries`)
console.log(`  Fixed→listed: ${fixedCount} entries`)
console.log(`  Original size: ${(originalLen / 1024 / 1024).toFixed(2)} MB`)
console.log(`  New size:      ${(newSrc.length / 1024 / 1024).toFixed(2)} MB`)
