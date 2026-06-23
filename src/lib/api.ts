import type { Article, Reference, RorOrganization, DoajJournalInfo } from './types'
import { ALL_JOURNALS, PSG_JOURNALS } from './data'

const CROSSREF = 'https://api.crossref.org'
const OPENALEX = 'https://api.openalex.org'
const ROR     = 'https://api.ror.org/v2'
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const PSG_PREFIX = '10.63802'
const PSG_MEMBER = '53186'
const ARTICLE_FILTER = 'type:journal-article'

// ─── Internal types ────────────────────────────────────────────────────────────

interface CrossrefAuthor {
  given?: string
  family?: string
  ORCID?: string
  sequence?: string
  affiliation?: { name: string; id?: { id: string; 'id-type': string }[] }[]
}

interface CrossrefWork {
  DOI: string
  title: string | string[]
  'container-title': string | string[]
  ISSN?: string[]
  author?: CrossrefAuthor[]
  abstract?: string
  license?: { URL: string }[]
  link?: { URL: string; 'content-type': string }[]
  resource?: { primary?: { URL: string } }
  volume?: string
  issue?: string
  page?: string
  type?: string
  'reference-count'?: number
  'is-referenced-by-count'?: number
  'published-online'?: { 'date-parts': number[][] }
  issued?: { 'date-parts': number[][] }
  created?: { 'date-time': string }
  deposited?: { 'date-time': string }
}

// ─── Advanced-query field parsing ─────────────────────────────────────────────

export interface SearchFields {
  freeText?: string
  title?: string
  author?: string
  journal?: string
  doi?: string
  year?: string
  abstract?: string
  keyword?: string
  institution?: string
  language?: string
  publisher?: string
}

/**
 * Parses advanced query syntax "TI=(value) AND AU=(value)" into structured fields.
 * Plain queries without field codes return as { freeText }.
 */
export function parseFieldQuery(query: string): SearchFields {
  if (!query.trim()) return {}
  if (!/[A-Z]{2,3}=\(/.test(query)) return { freeText: query }

  const fields: SearchFields = {}
  const re = /(?:^|\s+(?:AND|OR|NOT)\s+)([A-Z]{2,3})=\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    const code = m[1]
    const val = m[2].trim()
    if (!val) continue
    switch (code) {
      case 'TS': fields.freeText    = [fields.freeText, val].filter(Boolean).join(' '); break
      case 'TI': fields.title       = [fields.title, val].filter(Boolean).join(' '); break
      case 'AU': fields.author      = [fields.author, val].filter(Boolean).join(' '); break
      case 'SO': fields.journal     = val; break
      case 'DOI': fields.doi        = val; break
      case 'PY': fields.year        = val; break
      case 'AB': fields.abstract    = val; break
      case 'KW': fields.keyword     = val; break
      case 'OG': fields.institution = val; break
      case 'LA': fields.language    = val; break
      case 'PU': fields.publisher   = val; break
      default:   fields.freeText    = [fields.freeText, val].filter(Boolean).join(' ')
    }
  }
  return fields
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stripJats(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function reconstructAbstract(idx: Record<string, number[]> | null | undefined): string | null {
  if (!idx) return null
  const words: string[] = []
  for (const [word, positions] of Object.entries(idx)) {
    for (const pos of positions) words[pos] = word
  }
  return words.filter(Boolean).join(' ') || null
}

function calcMqs(item: CrossrefWork): number {
  let score = 0
  if (item.DOI) score += 20
  if (item.abstract) score += 20
  if (item.author?.some(a => !!a.ORCID)) score += 15
  if (item.author?.some(a => a.affiliation?.some(af => af.id?.length))) score += 15
  if ((item['reference-count'] ?? 0) > 0) score += 15
  if (item.license?.length) score += 10
  score += 5 // all PSG articles are OA
  return Math.min(score, 100)
}

function parseLicense(item: CrossrefWork): string | null {
  const url = item.license?.[0]?.URL
  if (!url) return null
  if (url.includes('/by/')) return 'CC BY 4.0'
  if (url.includes('/by-nc/')) return 'CC BY-NC 4.0'
  if (url.includes('/by-nc-nd/')) return 'CC BY-NC-ND 4.0'
  if (url.includes('/by-sa/')) return 'CC BY-SA 4.0'
  return url
}

function mapCrossrefWork(item: CrossrefWork): Article {
  const issn = item.ISSN?.[0] ?? ''
  const journal = ALL_JOURNALS.find(j => j.issn_online === issn)

  const rawTitle = item.title
  const title = Array.isArray(rawTitle) ? rawTitle[0] : (rawTitle ?? '')

  const rawJt = item['container-title']
  const journalTitle = Array.isArray(rawJt) ? rawJt[0] : (rawJt ?? journal?.title ?? '')

  const dateParts = (item['published-online'] ?? item.issued)?.['date-parts']?.[0] ?? []
  const year = dateParts[0] ?? new Date().getFullYear()
  const pubDate =
    dateParts.length >= 3
      ? `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`
      : dateParts[0]
        ? String(dateParts[0])
        : null

  const pageStr = item.page ?? ''
  const dash = pageStr.indexOf('-')
  const firstPage = dash > -1 ? pageStr.slice(0, dash) : pageStr || null
  const lastPage = dash > -1 ? pageStr.slice(dash + 1) : pageStr || null

  return {
    id: item.DOI,
    doi: item.DOI,
    title,
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: journalTitle,
    journal_code: journal?.journal_code ?? '',
    volume: item.volume ?? null,
    issue: item.issue ?? null,
    first_page: firstPage,
    last_page: lastPage,
    publication_year: year,
    publication_date: pubDate,
    article_type: item.type === 'journal-article' ? 'Research Article' : (item.type ?? 'Article'),
    language: 'English',
    abstract: item.abstract ? stripJats(item.abstract) : null,
    keywords: [],
    license: parseLicense(item),
    pdf_url: item.link?.find(l => l['content-type'] === 'application/pdf')?.URL ?? null,
    html_url: item.resource?.primary?.URL ?? null,
    openalex_work_id: null,
    crossref_status: 'verified',
    cited_by_count: item['is-referenced-by-count'] ?? 0,
    reference_count: item['reference-count'] ?? 0,
    is_retracted: false,
    metadata_quality_score: calcMqs(item),
    authors: (item.author ?? []).map((a, i) => ({
      id: a.ORCID ?? `${item.DOI}-au-${i}`,
      display_name: [a.given, a.family].filter(Boolean).join(' '),
      given_name: a.given ?? null,
      family_name: a.family ?? null,
      orcid: a.ORCID ? a.ORCID.replace('https://orcid.org/', '') : null,
      openalex_author_id: null,
      country: null,
      institution: a.affiliation?.[0]?.name ?? null,
      is_corresponding: a.sequence === 'first',
      author_order: i + 1,
    })),
    created_at: item.created?.['date-time'] ?? '',
    updated_at: item.deposited?.['date-time'] ?? '',
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function crossrefSearch(
  query: string,
  options: {
    page?: number
    rows?: number
    yearFrom?: number
    yearTo?: number
    scope?: 'all' | 'psg'  // 'all' = global Crossref, 'psg' = PSG member only
    issn?: string
    signal?: AbortSignal
  } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20, yearFrom, yearTo, scope = 'all', issn, signal } = options

  const offset = (page - 1) * rows
  const f = parseFieldQuery(query)

  // Combine year from field code and from options (field code takes precedence)
  const yr = f.year ? Number(f.year) : undefined
  const filterParts = [ARTICLE_FILTER]
  const yearF = yr ?? yearFrom
  const yearT = yr ?? yearTo
  if (yearF || yearT) {
    filterParts.push(`from-pub-date:${yearF ?? 1900}`, `until-pub-date:${yearT ?? new Date().getFullYear()}`)
  }
  if (issn) filterParts.push(`issn:${issn}`)
  if (f.doi) filterParts.push(`doi:${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`)
  if (f.language) filterParts.push(`language:${f.language}`)

  const hasQuery = !!(f.freeText || f.title || f.author || f.journal || f.abstract || f.keyword || f.institution)

  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    sort: hasQuery ? 'relevance' : 'published',
    order: 'desc',
    filter: filterParts.join(','),
    mailto: 'posi@panoramagroup.org',
  })

  // Map field codes to Crossref's named query params
  if (f.title)   params.set('query.title', f.title)
  if (f.author)  params.set('query.author', f.author)
  if (f.journal) params.set('query.container-title', f.journal)
  // Crossref has no separate abstract/keyword/institution param — append to general query
  const extra = [f.freeText, f.abstract, f.keyword, f.institution, f.publisher]
    .filter(Boolean).join(' ')
  if (extra) params.set('query', extra)

  const endpoint = scope === 'psg'
    ? `${CROSSREF}/members/${PSG_MEMBER}/works`
    : `${CROSSREF}/works`

  const headers: Record<string, string> = typeof window === 'undefined'
    ? { 'User-Agent': UA }
    : {}

  const res = await fetch(`${endpoint}?${params.toString()}`, { headers, signal })
  if (!res.ok) return { total: 0, items: [] }

  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map(mapCrossrefWork),
  }
}

export async function crossrefGetWork(doi: string): Promise<Article | null> {
  const res = await fetch(`${CROSSREF}/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  const data = await res.json()
  return mapCrossrefWork(data.message)
}

interface CrossrefRefItem {
  key?: string
  DOI?: string
  'article-title'?: string
  'volume-title'?: string
  author?: string
  year?: string
  'journal-title'?: string
  volume?: string
  issue?: string
  'first-page'?: string
  unstructured?: string
}

export async function crossrefGetReferences(doi: string): Promise<Reference[]> {
  try {
    const res = await fetch(
      `${CROSSREF}/works/${encodeURIComponent(doi)}?mailto=posi@panoramagroup.org`,
      { headers: { 'User-Agent': UA } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const refs: CrossrefRefItem[] = data.message?.reference ?? []
    return refs.map((r, i) => ({
      key:          r.key ?? String(i + 1),
      doi:          r.DOI ?? null,
      title:        r['article-title'] ?? r['volume-title'] ?? null,
      author:       r.author ?? null,
      year:         r.year ?? null,
      journal:      r['journal-title'] ?? null,
      volume:       r.volume ?? null,
      issue:        r.issue ?? null,
      first_page:   r['first-page'] ?? null,
      unstructured: r.unstructured ?? null,
    }))
  } catch {
    return []
  }
}

export async function crossrefGetJournalWorks(
  issn: string,
  options: { page?: number; rows?: number } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20 } = options
  const offset = (page - 1) * rows

  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    sort: 'published',
    order: 'desc',
    filter: ARTICLE_FILTER,
    mailto: 'posi@panoramagroup.org',
  })

  const res = await fetch(
    `${CROSSREF}/journals/${issn}/works?${params.toString()}`,
    { headers: { 'User-Agent': UA } }
  )
  if (!res.ok) {
    // Fallback: member works filtered by ISSN
    const fp = new URLSearchParams(params)
    fp.set('filter', `${ARTICLE_FILTER},issn:${issn}`)
    const fallback = await fetch(
      `${CROSSREF}/members/${PSG_MEMBER}/works?${fp.toString()}`,
      { headers: { 'User-Agent': UA } }
    )
    if (!fallback.ok) return { total: 0, items: [] }
    const d = await fallback.json()
    return {
      total: d.message['total-results'] ?? 0,
      items: (d.message.items ?? []).map(mapCrossrefWork),
    }
  }

  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map(mapCrossrefWork),
  }
}

export async function openAlexGetWork(doi: string): Promise<{
  id: string
  cited_by_count: number
  keywords: string[]
  abstract: string | null
} | null> {
  const res = await fetch(`${OPENALEX}/works/https://doi.org/${doi}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  const d = await res.json()
  return {
    id: d.id ?? '',
    cited_by_count: d.cited_by_count ?? 0,
    keywords: (d.keywords ?? []).map((k: { display_name: string }) => k.display_name),
    abstract: reconstructAbstract(d.abstract_inverted_index),
  }
}

// ─── OAI-PMH (primary harvest source) ────────────────────────────────────────

function xmlText(xml: string, tag: string): string {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim()
}

function xmlAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .trim()
    if (val) out.push(val)
  }
  return out
}

function parseOaiRecord(block: string): Article | null {
  const identifiers = xmlAll(block, 'identifier')
  const doi = identifiers.find(id => id.includes('doi.org/'))?.replace(/.*doi\.org\//, '')
    ?? identifiers.find(id => id.startsWith('10.'))
  if (!doi) return null

  const title = xmlText(block, 'title')
  if (!title) return null

  const creators = xmlAll(block, 'creator')
  const description = xmlText(block, 'description')
  const date = xmlText(block, 'date')
  const year = date ? parseInt(date.slice(0, 4), 10) : new Date().getFullYear()
  const rights = xmlText(block, 'rights')
  const source = xmlText(block, 'source')
  const subjects = xmlAll(block, 'subject').filter(Boolean)
  const setSpec = xmlAll(block, 'setSpec')[0] ?? ''

  const codeMatch = doi.match(/10\.63802\/([a-z]+)\./i)
  const journalCode = codeMatch?.[1]?.toLowerCase() ?? setSpec.split(':')[0].toLowerCase()
  const journal = ALL_JOURNALS.find(j => j.journal_code === journalCode)

  const volMatch = source.match(/[Vv]ol\.?\s*(\d+)/)
  const issueMatch = source.match(/[Nn]o\.?\s*(\d+)/)

  let license: string | null = null
  if (rights.includes('/by/4')) license = 'CC BY 4.0'
  else if (rights.includes('/by-nc-nd/')) license = 'CC BY-NC-ND 4.0'
  else if (rights.includes('/by-nc/')) license = 'CC BY-NC 4.0'
  else if (rights.includes('/by-sa/')) license = 'CC BY-SA 4.0'

  const htmlUrl = identifiers.find(id => id.startsWith('http') && !id.includes('doi.org') && id.includes('/article/'))

  const authors = creators.map((c, i) => {
    const commaIdx = c.indexOf(',')
    const family = commaIdx > -1 ? c.slice(0, commaIdx).trim() : c
    const given = commaIdx > -1 ? c.slice(commaIdx + 1).trim() : null
    return {
      id: `${doi}-au-${i}`,
      display_name: given ? `${given} ${family}` : c,
      given_name: given,
      family_name: family,
      orcid: null,
      openalex_author_id: null,
      country: null,
      institution: null,
      is_corresponding: i === 0,
      author_order: i + 1,
    }
  })

  return {
    id: doi,
    doi,
    title,
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: (journal?.title ?? source.split(';')[0].trim()) || '',
    journal_code: journalCode,
    volume: volMatch?.[1] ?? null,
    issue: issueMatch?.[1] ?? null,
    first_page: null,
    last_page: null,
    publication_year: year,
    publication_date: date || null,
    article_type: 'Research Article',
    language: 'English',
    abstract: description || null,
    keywords: subjects,
    license,
    pdf_url: null,
    html_url: htmlUrl ?? null,
    openalex_work_id: null,
    crossref_status: 'registered',
    cited_by_count: 0,
    reference_count: 0,
    is_retracted: false,
    metadata_quality_score: description ? 55 : 35,
    authors,
    created_at: date || '',
    updated_at: date || '',
  }
}

// Derive per-journal OAI endpoint: use oai_base_url if set, else append /oai to website_url
function getJournalOaiUrl(journalCode: string): string | null {
  const journal = ALL_JOURNALS.find(j => j.journal_code === journalCode)
  if (!journal) return null
  if (journal.oai_base_url) return journal.oai_base_url
  if (journal.website_url) return journal.website_url.replace(/\/+$/, '') + '/oai'
  return null
}

async function oaiFetchUrl(url: string, params: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url + '?' + new URLSearchParams(params).toString(), {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    })
    return res.ok ? res.text() : null
  } catch {
    return null
  }
}

export async function oaiHarvestJournal(journalCode: string): Promise<Article[]> {
  const oaiUrl = getJournalOaiUrl(journalCode)
  if (!oaiUrl) return []

  const articles: Article[] = []
  let token: string | null = null

  do {
    const xml = await oaiFetchUrl(
      oaiUrl,
      token
        ? { verb: 'ListRecords', resumptionToken: token }
        : { verb: 'ListRecords', metadataPrefix: 'oai_dc' }
    )
    if (!xml || xml.includes('<error')) break

    for (const block of xml.match(/<record>[\s\S]*?<\/record>/g) ?? []) {
      const a = parseOaiRecord(block)
      if (a) articles.push(a)
    }

    token = (/<resumptionToken[^>]*>([^<]*)<\/resumptionToken>/.exec(xml)?.[1] ?? '').trim() || null
  } while (token)

  return articles
}

// Harvest all indexed journals via their individual OAI endpoints
export async function oaiHarvestAll(): Promise<Article[]> {
  const results = await Promise.allSettled(
    ALL_JOURNALS.map(j => oaiHarvestJournal(j.journal_code))
  )
  return results
    .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
}

// ─── ISSN Portal (registration country) ──────────────────────────────────────

export async function issnGetCountry(issn: string): Promise<string | null> {
  try {
    const res = await fetch(`https://portal.issn.org/resource/ISSN/${issn}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; POSI-Bot/1.0; +https://posi.panorama-sg.com)',
        'Accept': 'application/ld+json, application/json;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()

    // ISSN Portal flat JSON format: publication[0].location[].label
    const locations = data?.publication?.[0]?.location
    if (Array.isArray(locations) && locations.length > 0) {
      type LocEntry = { label?: string }
      const label = (locations as LocEntry[]).find(l => typeof l.label === 'string' && l.label)?.label
      if (typeof label === 'string' && label) {
        // Portal returns ALL-CAPS (e.g. "HONG KONG S.A.R., CHINA").
        // \b\w+ correctly preserves single-letter abbreviations like S.A.R. as-is
        // since each letter is already uppercase and slice(1) is empty.
        return label === label.toUpperCase()
          ? label.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          : label
      }
    }

    return null
  } catch {
    return null
  }
}

// ─── Crossref journals search ─────────────────────────────────────────────────

export interface CrossrefJournalItem {
  title: string
  issn: string[]
  publisher: string
  total_dois: number
  subjects: string[]
}

export async function crossrefSearchJournals(
  query: string,
  options: { rows?: number; offset?: number } = {}
): Promise<{ total: number; items: CrossrefJournalItem[] }> {
  const { rows = 20, offset = 0 } = options
  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    mailto: 'posi@panoramagroup.org',
  })
  if (query) params.set('query', query)
  const res = await fetch(`${CROSSREF}/journals?${params.toString()}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return { total: 0, items: [] }
  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map((j: {
      title: string
      ISSN?: string[]
      publisher?: string
      counts?: { 'total-dois'?: number }
      subjects?: { name: string }[]
    }) => ({
      title: j.title ?? '',
      issn: j.ISSN ?? [],
      publisher: j.publisher ?? '',
      total_dois: j.counts?.['total-dois'] ?? 0,
      subjects: (j.subjects ?? []).map((s: { name: string }) => s.name),
    })),
  }
}

// ─── Crossref journal metadata ────────────────────────────────────────────────

export interface CrossrefJournalMeta {
  title: string
  issn: string[]
  publisher: string
  publisher_location: string | null
  total_dois: number
  subjects: string[]
}

export async function crossrefFetchJournal(issn: string): Promise<CrossrefJournalMeta | null> {
  // Fetch journal metadata and accurate article-only count in parallel
  const [metaRes, countRes] = await Promise.all([
    fetch(`${CROSSREF}/journals/${issn}?mailto=posi@panoramagroup.org`, { headers: { 'User-Agent': UA } }),
    fetch(`${CROSSREF}/journals/${issn}/works?filter=${ARTICLE_FILTER}&rows=0&mailto=posi@panoramagroup.org`, { headers: { 'User-Agent': UA } }),
  ])
  if (!metaRes.ok) return null
  const meta = (await metaRes.json()).message
  const articleCount = countRes.ok ? ((await countRes.json()).message?.['total-results'] ?? 0) : (meta.counts?.['total-dois'] ?? 0)
  return {
    title: meta.title ?? '',
    issn: meta.ISSN ?? [issn],
    publisher: meta.publisher ?? '',
    publisher_location: (meta['publisher-location'] as string) ?? null,
    total_dois: articleCount,
    subjects: ((meta.subjects ?? []) as { name: string }[]).map((s: { name: string }) => s.name),
  }
}

// ─── Crossref full harvest (DOI prefix pagination) ───────────────────────────

// Harvest all PSG articles from Crossref member endpoint (build-time only)
export async function crossrefHarvestAll(): Promise<Article[]> {
  const all: Article[] = []
  let offset = 0
  const rows = 100

  for (;;) {
    const params = new URLSearchParams({
      rows: String(rows),
      offset: String(offset),
      sort: 'published',
      order: 'asc',
      filter: ARTICLE_FILTER,
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${CROSSREF}/members/${PSG_MEMBER}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) break
    const data = await res.json()
    const items: CrossrefWork[] = data.message?.items ?? []
    if (items.length === 0) break
    all.push(...items.map(mapCrossrefWork))
    if (items.length < rows) break
    offset += rows
  }

  return all
}

// Harvest all articles for a specific journal ISSN (build-time only)
export async function crossrefHarvestJournal(issn: string): Promise<Article[]> {
  const all: Article[] = []
  let offset = 0
  const rows = 100

  for (;;) {
    const params = new URLSearchParams({
      rows: String(rows),
      offset: String(offset),
      sort: 'published',
      order: 'desc',
      filter: ARTICLE_FILTER,
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${CROSSREF}/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) break
    const data = await res.json()
    const items: CrossrefWork[] = data.message?.items ?? []
    if (items.length === 0) break
    all.push(...items.map(mapCrossrefWork))
    if (items.length < rows) break
    offset += rows
  }

  return all
}

// ─── ROR (Research Organization Registry) ────────────────────────────────────

type RorOrgRaw = Record<string, unknown>

function mapRorOrg(org: RorOrgRaw): RorOrganization {
  const names = (org.names as Array<{ value: string; types: string[] }>) ?? []
  const name = names.find(n => n.types.includes('ror_display'))?.value ?? names[0]?.value ?? ''
  const locs = (org.locations as Array<{ geonames_details: { country_name: string; country_code: string } }>) ?? []
  const geo = locs[0]?.geonames_details
  const links = (org.links as Array<{ value: string }>) ?? []
  return {
    id: (org.id as string) ?? '',
    name,
    country: geo?.country_name ?? '',
    country_code: geo?.country_code ?? '',
    types: ((org.types as string[]) ?? []).map(t => String(t).toLowerCase()),
    website: links[0]?.value ?? null,
  }
}

// Match a raw affiliation string (department name, university, etc.) to a ROR record.
// Returns the best match only when the API is confident (chosen: true).
export async function rorMatchAffiliation(affiliation: string): Promise<RorOrganization | null> {
  try {
    const res = await fetch(
      `${ROR}/organizations?affiliation=${encodeURIComponent(affiliation)}`,
      { headers: { 'User-Agent': UA } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const chosen = (data.items ?? []).find((item: { chosen: boolean }) => item.chosen)
    return chosen ? mapRorOrg(chosen.organization) : null
  } catch {
    return null
  }
}

// Free-text name search (paginated).
export async function rorSearch(
  query: string,
  page = 1
): Promise<{ total: number; items: RorOrganization[] }> {
  try {
    const params = new URLSearchParams({ query, page: String(page) })
    const res = await fetch(`${ROR}/organizations?${params.toString()}`, {
      headers: { 'User-Agent': UA }
    })
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json()
    return {
      total: data.number_of_results ?? 0,
      items: (data.items ?? []).map((item: RorOrgRaw) =>
        mapRorOrg((item.organization as RorOrgRaw) ?? item)
      ),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

// Fetch a single organisation by full ROR URL or bare ID (e.g. "04aj4c181").
export async function rorGetOrg(rorId: string): Promise<RorOrganization | null> {
  try {
    const id = rorId.replace('https://ror.org/', '')
    const res = await fetch(`${ROR}/organizations/${id}`, {
      headers: { 'User-Agent': UA }
    })
    if (!res.ok) return null
    return mapRorOrg(await res.json())
  } catch {
    return null
  }
}

// ─── OpenAlex article search ──────────────────────────────────────────────────

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string | null
  publication_year: number | null
  publication_date: string | null
  type: string | null
  language: string | null
  is_retracted: boolean
  cited_by_count: number
  referenced_works_count: number
  abstract_inverted_index: Record<string, number[]> | null
  biblio: { volume?: string; issue?: string; first_page?: string; last_page?: string } | null
  primary_location: {
    source?: { display_name?: string; issn_l?: string; issn?: string[] } | null
    landing_page_url?: string | null
  } | null
  open_access: { oa_url?: string | null; oa_status?: string } | null
  authorships: Array<{
    author: { id?: string; display_name?: string; orcid?: string | null } | null
    institutions: Array<{ display_name?: string }> | null
    countries: string[] | null
    is_corresponding: boolean
  }>
  keywords: Array<{ display_name: string }> | null
}

function mapOpenAlexWork(work: OpenAlexWork): Article {
  const rawDoi = work.doi?.replace('https://doi.org/', '') ?? ''
  const issn = work.primary_location?.source?.issn_l
    ?? work.primary_location?.source?.issn?.[0]
    ?? ''
  const journal = ALL_JOURNALS.find(j =>
    j.issn_online === issn || j.issn_print === issn
  )
  const abstract = reconstructAbstract(work.abstract_inverted_index)

  let mqs = 20
  if (rawDoi)   mqs += 20
  if (abstract) mqs += 20
  if (work.authorships?.some(a => a.author?.orcid)) mqs += 15
  if (work.authorships?.some(a => (a.institutions ?? []).length > 0)) mqs += 10
  if ((work.referenced_works_count ?? 0) > 0) mqs += 10
  if (work.open_access?.oa_url) mqs += 5

  return {
    id: rawDoi || work.id,
    doi: rawDoi,
    title: work.title ?? '',
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: work.primary_location?.source?.display_name ?? '',
    journal_code: journal?.journal_code ?? '',
    volume: work.biblio?.volume ?? null,
    issue: work.biblio?.issue ?? null,
    first_page: work.biblio?.first_page ?? null,
    last_page: work.biblio?.last_page ?? null,
    publication_year: work.publication_year ?? new Date().getFullYear(),
    publication_date: work.publication_date ?? null,
    article_type: work.type === 'article' ? 'Research Article' : (work.type ?? 'Article'),
    language: work.language ?? 'English',
    abstract,
    keywords: (work.keywords ?? []).map(k => k.display_name),
    license: work.open_access?.oa_status === 'gold' || work.open_access?.oa_status === 'diamond'
      ? 'Open Access' : null,
    pdf_url: work.open_access?.oa_url ?? null,
    html_url: work.primary_location?.landing_page_url ?? null,
    openalex_work_id: work.id,
    crossref_status: rawDoi ? 'registered' : null,
    cited_by_count: work.cited_by_count ?? 0,
    reference_count: work.referenced_works_count ?? 0,
    is_retracted: work.is_retracted ?? false,
    metadata_quality_score: Math.min(mqs, 100),
    authors: (work.authorships ?? []).map((a, i) => ({
      id: a.author?.id ?? `${work.id}-au-${i}`,
      display_name: a.author?.display_name ?? '',
      given_name: null,
      family_name: null,
      orcid: a.author?.orcid?.replace('https://orcid.org/', '') ?? null,
      openalex_author_id: a.author?.id ?? null,
      country: a.countries?.[0] ?? null,
      institution: a.institutions?.[0]?.display_name ?? null,
      is_corresponding: a.is_corresponding ?? i === 0,
      author_order: i + 1,
    })),
    created_at: work.publication_date ?? '',
    updated_at: work.publication_date ?? '',
  }
}

const OA_SELECT = [
  'id', 'doi', 'title', 'publication_year', 'publication_date', 'type', 'language',
  'is_retracted', 'cited_by_count', 'referenced_works_count', 'abstract_inverted_index',
  'biblio', 'primary_location', 'open_access', 'authorships', 'keywords',
].join(',')

export async function openalexSearch(
  query: string,
  options: {
    page?: number
    rows?: number
    yearFrom?: number
    yearTo?: number
    issn?: string
    signal?: AbortSignal
  } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20, yearFrom, yearTo, issn, signal } = options

  const f = parseFieldQuery(query)

  const yr = f.year ? Number(f.year) : undefined
  const filterParts = ['type:article']

  // Year filter (field code takes precedence over sidebar filter)
  const yearF = yr ?? yearFrom
  const yearT = yr ?? yearTo
  if (yearF && yearT && yearF === yearT) filterParts.push(`publication_year:${yearF}`)
  else if (yearF) filterParts.push(`publication_year:>${yearF - 1}`)
  else if (yearT) filterParts.push(`publication_year:<${yearT + 1}`)

  if (issn) filterParts.push(`primary_location.source.issn:${issn}`)

  // Map field codes to OpenAlex filter syntax
  if (f.doi) {
    const clean = f.doi.replace(/^https?:\/\/doi\.org\//i, '')
    filterParts.push(`doi:https://doi.org/${clean}`)
  }
  if (f.author)      filterParts.push(`authorships.author.display_name.search:${f.author}`)
  if (f.title)       filterParts.push(`title.search:${f.title}`)
  if (f.journal)     filterParts.push(`primary_location.source.display_name.search:${f.journal}`)
  if (f.institution) filterParts.push(`authorships.institutions.display_name.search:${f.institution}`)
  if (f.keyword)     filterParts.push(`keywords.keyword.search:${f.keyword}`)
  if (f.language)    filterParts.push(`language:${f.language}`)
  if (f.publisher)   filterParts.push(`primary_location.source.publisher_lineage_name.search:${f.publisher}`)

  const params = new URLSearchParams({
    'per-page': String(rows),
    page: String(page),
    filter: filterParts.join(','),
    select: OA_SELECT,
    mailto: 'posi@panoramagroup.org',
  })

  // Free text search (TS field, AB field, or plain queries without field codes)
  const searchTerm = [f.freeText, f.abstract].filter(Boolean).join(' ')
  if (searchTerm) {
    params.set('search', searchTerm)
  } else if (!f.title && !f.author && !f.doi && !f.keyword && !f.journal && !f.institution) {
    // No structured query and no free text: sort by recent
    params.set('sort', 'publication_date:desc')
  }

  const res = await fetch(`${OPENALEX}/works?${params.toString()}`, { signal })
  if (!res.ok) return { total: 0, items: [] }

  const data = await res.json()
  return {
    total: data.meta?.count ?? 0,
    items: (data.results ?? []).map(mapOpenAlexWork),
  }
}

// ─── DOAJ (Directory of Open Access Journals) ────────────────────────────────

const DOAJ = 'https://doaj.org/api'

export async function doajGetJournal(issn: string): Promise<DoajJournalInfo | null> {
  try {
    const res = await fetch(`${DOAJ}/search/journals/issn:${issn}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const data = await res.json()
    const first = data.results?.[0]
    if (!first) return null
    const bib = (first.bibjson ?? {}) as Record<string, unknown>
    const admin = (first.admin ?? {}) as Record<string, unknown>
    return {
      in_doaj: true, // presence in DOAJ API v4 results implies listing
      has_seal: (admin.ticked as boolean) ?? false,
      license: ((bib.license as Array<{ type: string }>)?.[0]?.type) ?? null,
      has_apc: ((bib.apc as { has_apc?: boolean })?.has_apc) ?? false,
      apc_max: ((bib.apc as { max?: { currency: string; price: number }[] })?.max) ?? [],
      subjects: ((bib.subject as Array<{ term: string }>) ?? []).map(s => s.term),
      last_updated: (first.last_updated as string) ?? null,
      doaj_id: (first.id as string) ?? null,
      publication_time_weeks: (bib.publication_time_weeks as number) ?? null,
      publisher_country_code: ((bib.publisher as { country?: string })?.country) ?? null,
    }
  } catch {
    return null
  }
}

// Full Article object from OpenAlex (used by /cite as fallback when Crossref has no record)
export async function openAlexGetArticle(doi: string): Promise<Article | null> {
  try {
    const params = new URLSearchParams({ select: OA_SELECT, mailto: 'posi@panoramagroup.org' })
    const res = await fetch(
      `${OPENALEX}/works/https://doi.org/${encodeURIComponent(doi)}?${params.toString()}`,
      { headers: { 'User-Agent': UA } }
    )
    if (!res.ok) return null
    return mapOpenAlexWork(await res.json())
  } catch {
    return null
  }
}

// Legacy aliases used by /api/doi/[doi]
export const fetchOpenAlexWork = openAlexGetWork
export const fetchCrossrefWork = crossrefGetWork

export async function fetchOpenAlexSearch(query: string, page = 1) {
  const params = new URLSearchParams({
    search: query,
    filter: `doi_starts_with:${PSG_PREFIX}`,
    page: String(page),
    per_page: '20',
    select: 'id,title,doi,publication_year,primary_location,cited_by_count',
  })
  const res = await fetch(`${OPENALEX}/works?${params.toString()}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  return res.json()
}
