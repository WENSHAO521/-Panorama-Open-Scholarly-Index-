/**
 * Cloudflare Pages Function — proxy for BnF (Bibliothèque nationale de France) SRU title/author search.
 * No API key required; CORS bypass only.
 *
 * Usage: GET /api/bnf-search?q=proust&target=title
 *        target: title | author | any (default: any)
 */
export async function onRequestGet({ request }) {
  const url    = new URL(request.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const target = url.searchParams.get('target') ?? 'any'

  if (!q) return json({ total: 0, items: [] }, 200)

  let cql
  if (target === 'title')       cql = `bib.title all "${q.replace(/"/g, '')}"`
  else if (target === 'author') cql = `bib.author all "${q.replace(/"/g, '')}"`
  else                          cql = `bib.anywhere all "${q.replace(/"/g, '')}"`

  const params = new URLSearchParams({
    version: '1.2',
    operation: 'searchRetrieve',
    query: cql,
    recordSchema: 'oai_dc',
    maximumRecords: '15',
    startRecord: '1',
  })

  let upstream
  try {
    upstream = await fetch(`https://catalogue.bnf.fr/api/SRU?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `BnF ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'numberOfRecords') || '0', 10)

  const recordBlocks = xmlAll(xml, 'zs:record').length
    ? xmlAll(xml, 'zs:record')
    : xmlAll(xml, 'record')

  const items = recordBlocks.map(block => {
    // BnF title format: "Main title : subtitle / contributor info"
    const rawTitle = xmlText(block, 'title')
    if (!rawTitle) return null
    const titleBody = rawTitle.split(' / ')[0].trim()
    const colonIdx  = titleBody.indexOf(' : ')
    const title     = colonIdx > -1 ? titleBody.slice(0, colonIdx).trim() : titleBody
    if (!title) return null

    const creators = xmlAll(block, 'creator')
    const authors = creators.map(c => {
      const s = c.replace(/\s*\(\d{4}-(\d{4})?\)\.?/, '').trim()
      const comma = s.indexOf(',')
      if (comma === -1) return s
      return [s.slice(comma + 1).trim(), s.slice(0, comma).trim()].filter(Boolean).join(' ')
    }).filter(Boolean)

    const publisher  = xmlText(block, 'publisher') || null
    const dateRaw    = xmlText(block, 'date')
    const year       = parseInt(dateRaw.match(/\d{4}/)?.[0] ?? '', 10) || null
    const identifiers = xmlAll(block, 'identifier')
    const isbn = identifiers
      .map(id => id.replace(/isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim())
      .find(id => /^\d{10,13}$/.test(id)) ?? ''

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: null, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// Namespace-aware helpers — match <tag>, <ns:tag>, <ns_other:tag> equally
function xmlText(xml, tag) {
  const re  = new RegExp(`<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const re  = new RegExp(`<(?:[a-z_]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z_]+:)?${tag}>`, 'gi')
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
    if (val) out.push(val)
  }
  return out
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
