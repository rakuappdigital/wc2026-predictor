import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchWC2026Matches } from '@/lib/football-api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const data = await fetchWC2026Matches()
    const matches = data.matches

    const rows = matches
      .filter((m: any) => m.homeTeam?.name && m.awayTeam?.name)
      .map((m: any) => ({
        api_id: m.id,
        home_team: m.homeTeam.name,
        away_team: m.awayTeam.name,
        home_team_flag: m.homeTeam.crest ?? null,
        away_team_flag: m.awayTeam.crest ?? null,
        kickoff_time: m.utcDate,
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        status: m.status === 'FINISHED' ? 'finished' : (['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(m.status)) ? 'live' : 'upcoming',
        matchday: m.matchday,
        stage: m.stage,
        goals: m.goals ?? [],
        bookings: m.bookings ?? [],
      }))

    const { error } = await supabaseAdmin
      .from('matches')
      .upsert(rows, { onConflict: 'api_id' })

    if (error) throw error

    const statusSummary = matches.reduce((acc: any, m: any) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    }, {})

    const liveMatches = matches
      .filter((m: any) => ['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(m.status))
      .map((m: any) => ({ id: m.id, home: m.homeTeam?.name, away: m.awayTeam?.name, status: m.status, hasNames: !!(m.homeTeam?.name && m.awayTeam?.name) }))

    return NextResponse.json({ synced: rows.length, statuses: statusSummary, liveMatches })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
