import { NextResponse } from 'next/server'

const API_KEY = process.env.FOOTBALL_DATA_API_KEY!

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`https://api.football-data.org/v4/matches/${id}`, {
      headers: { 'X-Auth-Token': API_KEY },
      next: { revalidate: 60 },
    } as RequestInit)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()

    return NextResponse.json({
      goals: data.goals ?? [],
      bookings: data.bookings ?? [],
      status: data.status,
      home_score: data.score?.fullTime?.home ?? null,
      away_score: data.score?.fullTime?.away ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
