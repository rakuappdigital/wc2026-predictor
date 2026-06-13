import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchWC2026Matches } from '@/lib/football-api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const data = await fetchWC2026Matches()
    const matches = data.matches

    const rows = matches.map((m: any) => ({
      api_id: m.id,
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      home_team_flag: m.homeTeam.crest,
      away_team_flag: m.awayTeam.crest,
      kickoff_time: m.utcDate,
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      status: m.status === 'FINISHED' ? 'finished' : m.status === 'IN_PLAY' ? 'live' : 'upcoming',
      matchday: m.matchday,
      stage: m.stage,
    }))

    const { error } = await supabaseAdmin
      .from('matches')
      .upsert(rows, { onConflict: 'api_id' })

    if (error) throw error

    return NextResponse.json({ synced: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
