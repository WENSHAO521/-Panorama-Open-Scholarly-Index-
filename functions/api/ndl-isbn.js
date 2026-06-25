/**
 * Cloudflare Pages Function — proxy for Japan National Diet Library SRU API.
 * No API key required; this proxy exists solely to bypass CORS restrictions on
 * the NDL SRU endpoint (iss.ndl.go.jp) when called from a browser.
 *
 * Usage: GET /api/ndl-isbn?isbn=9784003010105
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)

  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) {
    return json({ error: 'Invalid isbn' }, 400)
  }

  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    version: '1.2',
    query: `isbn="${clean}"`,
    recordSchema: 'dc',
    maximumRecords: '1',
  })

  let upstream
  try {
    upstream = await fetch(`https://iss.ndl.go.jp/api/sru?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NDL ${upstream.status}` }, 502)

  const xml = await upstream.text()

  const title = xmlText(xml, 'title')
  if (!title) return json({ found: false }, 200)

  const creators = xmlAll(xml, 'creator')
  const publisher = xmlText(xml, 'publisher') || null
  const date = xmlText(xml, 'date') || xmlText(xml, 'issued')
  const year = date.match(/\d{4}/)?.[0] ?? null
  const subjects = xmlAll(xml, 'subject')

  // NDL stores creators as "姓, 名" for Western names or "姓名" for Japanese names.
  // Also strips birth/death year annotations like "著者名, 1934-2010"
  const authors = creators.map(c => {
    const s = c.replace(/,\s*\d{4}[-–]\d{0,4}\.?$/, '').trim()
    const comma = s.indexOf(',')
    if (comma === -1) return s
    const last  = s.slice(0, comma).trim()
    const first = s.slice(comma + 1).trim()
    return first ? `${first} ${last}` : last
  }).filter(Boolean)

  return json({ found: true, title, authors, year, publisher, subjects }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xmlText(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'i'
  )
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function xmlAll(xml, tag) {
  const re = new RegExp(
    `<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'gi'
  )
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
    if (val) out.push(val)
  }
  return out
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
