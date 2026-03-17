import { NextResponse } from 'next/server'

const AUTONOM_API_KEY = '4A3F51C74E338FE80B0B006A030F33EB'
const AUTONOM_BASE = 'https://oracle.autonom.cc'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const feedIds = searchParams.get('feed_ids') || '1030,1029,1022,1002,2056,2003,2069,2025'

  try {
    const res = await fetch(
      `${AUTONOM_BASE}/prices/batch?feed_ids=${feedIds}&fresh=true`,
      { headers: { 'x-api-key': AUTONOM_API_KEY } }
    )

    const text = await res.text()

    if (!res.ok) {
      return NextResponse.json({ error: `Autonom error ${res.status}`, body: text }, { status: 502 })
    }

    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ raw: text })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
