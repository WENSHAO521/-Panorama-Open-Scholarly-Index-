/**
 * Cloudflare Pages Function — proxy for Japan NDL (National Diet Library) SRU title/author search.
 * No API key required; CORS bypass only.
 *
 * Usage: GET /api/ndl-search?q=銀河鉄道の夜&target=title
 *        target: title | author | any (default: any)
 */
export async function onRequestGet({ request }) {
  const url    = new URL(request.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const target = url.searchParams.get('target') ?? 'any'

  if (!q) return json({ total: 0, items: [] }, 200)

  let cql
  if (target === 'title')       cql = `title="${q}"`
  else if (target === 'author') cql = `creator="${q}"`
  else                          cql = `(title="${q}" or creator="${q}")`

  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    version: '1.2',
    recordSchema: 'dc',
    maximumRecords: '15',
    startRecord: '1',
    query: cql,
  })

  let upstream
  try {
    upstream = await fetch(`https://iss.ndl.go.jp/api/sru?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NDL ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'numberOfRecords') || '0', 10)

  const recordBlocks = xmlAll(xml, 'zs:record').length
    ? xmlAll(xml, 'zs:record')
    : xmlAll(xml, 'record')

  const items = recordBlocks.map(block => {
    const title = xmlText(block, 'title')
    if (!title) return null

    const creatorsRaw = xmlAll(block, 'creator')
    const authors = creatorsRaw
      .map(a => a.replace(/\s*\d{4}-(\d{4})?$/, '').trim())
      .filter(Boolean)

    const publisher = xmlText(block, 'publisher') || null
    const dateRaw   = xmlText(block, 'date')
    const year      = parseInt(dateRaw.match(/\d{4}/)?.[0] ?? '', 10) || null

    // NDL identifier fields can be "ISBN:XXXX" or "urn:isbn:XXXX" or just digits
    const identifiers = xmlAll(block, 'identifier')
    const isbn = identifiers
      .map(id => id.replace(/(?:urn:)?isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim())
      .find(id => /^\d{10,13}$/.test(id)) ?? ''

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: null, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

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
