import { NextResponse } from 'next/server'

const AUTONOM_API_KEY = '4A3F51C74E338FE80B0B006A030F33EB'
const AUTONOM_BASE = 'https://oracle.autonom.cc'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const feedIds = searchParams.get('feed_ids') || '1030,1029,1022,1002,2056,2003,2069,2025'

  try {
    const res = await fetch(
      `${AUTONOM_BASE}/prices/batch?feed_ids=${feedIds}&fresh=true`,
      {
        headers: { 'x-api-key': AUTONOM_API_KEY },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Autonom API error', status: res.status }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
