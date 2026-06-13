import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePoints } from '@/lib/points'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*, matches(*)')
    .eq('calculated', false)

  if (!predictions?.length) return NextResponse.json({ updated: 0 })

  let updated = 0
  for (const pred of predictions) {
    const match = pred.matches
    if (match.status !== 'finished' || match.home_score === null) continue

    const points = calculatePoints(
      pred.home_pred,
      pred.away_pred,
      match.home_score,
      match.away_score
    )

    await supabaseAdmin
      .from('predictions')
      .update({ points_earned: points, calculated: true })
      .eq('id', pred.id)

    await supabaseAdmin.rpc('increment_points', {
      user_id: pred.user_id,
      amount: points,
    })

    updated++
  }

  return NextResponse.json({ updated })
}
