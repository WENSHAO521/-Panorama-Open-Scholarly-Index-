/**
 * Extract a bare DOI from a raw DOI string or a doi.org URL.
 * Returns null when the input does not look like a DOI.
 * Examples:
 *   "10.1007/s12525-019-00362-x"          → "10.1007/s12525-019-00362-x"
 *   "https://doi.org/10.1007/s12525…"     → "10.1007/s12525…"
 *   "http://dx.doi.org/10.2753/MIS0742…"  → "10.2753/MIS0742…"
 */
export function extractDoi(query: string): string | null {
  const s = query.trim()
  // doi.org URL (https / http, dx. prefix optional)
  const urlMatch = s.match(/^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,}\/.+)$/i)
  if (urlMatch) return urlMatch[1].replace(/[.,;:)\]>'"\s]+$/, '')
  // bare DOI starting with 10.
  const rawMatch = s.match(/^(10\.\d{4,}\/.+)$/i)
  if (rawMatch) return rawMatch[1].replace(/[.,;:)\]>'"\s]+$/, '')
  return null
}

/**
 * Word-overlap similarity between two strings (0–1).
 * Ignores punctuation and stop-words shorter than 3 characters.
 * Used to detect when a search result is an exact/near-exact title match.
 */
export function wordOverlap(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    )
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 || setB.size === 0) return 0
  let hits = 0
  setA.forEach(w => { if (setB.has(w)) hits++ })
  return hits / Math.max(setA.size, setB.size)
}

/**
 * Extract a bare ISBN-10 or ISBN-13 from user input (strips hyphens/spaces).
 * Returns null when the input does not look like a valid ISBN.
 */
export function extractIsbn(s: string): string | null {
  const clean = s.trim().replace(/[-\s]/g, '')
  if (/^\d{13}$/.test(clean) && (clean.startsWith('978') || clean.startsWith('979'))) return clean
  if (/^\d{9}[\dXx]$/.test(clean)) return clean.toUpperCase()
  return null
}

/** Decode HTML entities commonly found in article metadata from Crossref/OpenAlex. */
export function decodeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
