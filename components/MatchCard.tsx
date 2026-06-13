'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Match {
  id: number
  home_team: string
  away_team: string
  home_team_flag: string
  away_team_flag: string
  kickoff_time: string
  home_score: number | null
  away_score: number | null
  status: string
  stage: string
}

interface Prediction {
  home_pred: number
  away_pred: number
  points_earned: number
  calculated: boolean
}

interface Props {
  match: Match
  prediction?: Prediction
  userId?: string
}

export default function MatchCard({ match, prediction, userId }: Props) {
  const router = useRouter()
  const [homePred, setHomePred] = useState('')
  const [awayPred, setAwayPred] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)

  const kickoff = new Date(match.kickoff_time)
  const isPast = kickoff < new Date()
  const canPredict = !isPast && userId && match.status === 'upcoming' && !prediction

  async function savePrediction() {
    if (!userId || homePred === '' || awayPred === '') return
    setSaving(true)
    const { error } = await supabase.from('predictions').insert({
      user_id: userId,
      match_id: match.id,
      home_pred: Number(homePred),
      away_pred: Number(awayPred),
    })
    setSaving(false)
    if (!error) setSaved(true)
  }

  const statusBadge = {
    upcoming: { label: 'Yaklaşan', color: 'bg-blue-600' },
    live: { label: '🔴 Canlı', color: 'bg-red-600 animate-pulse' },
    finished: { label: 'Bitti', color: 'bg-gray-600' },
  }[match.status] ?? { label: match.status, color: 'bg-gray-600' }

  const hasPrediction = saved || !!prediction
  const isClickable = hasPrediction || match.status !== 'upcoming'

  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 transition-colors ${isClickable ? 'hover:border-gray-600 cursor-pointer' : ''}`}
      onClick={isClickable ? () => router.push(`/match/${match.id}`) : undefined}
    >
      <div className="flex justify-between items-center mb-4">
        <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
        <span className="text-gray-400 text-xs">
          {kickoff.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          {match.home_team_flag && (
            <img src={match.home_team_flag} alt="" className="w-10 h-10 mx-auto mb-2 object-contain" />
          )}
          <p className="text-white font-semibold text-sm">{match.home_team}</p>
        </div>

        <div className="text-center min-w-[80px]">
          {match.status === 'finished' || match.status === 'live' ? (
            <div className="text-2xl font-bold text-white">
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <div className="text-gray-500 text-lg font-bold">vs</div>
          )}
        </div>

        <div className="flex-1 text-center">
          {match.away_team_flag && (
            <img src={match.away_team_flag} alt="" className="w-10 h-10 mx-auto mb-2 object-contain" />
          )}
          <p className="text-white font-semibold text-sm">{match.away_team}</p>
        </div>
      </div>

      {/* Tahmin bölümü */}
      {userId && (
        <div className="mt-4 pt-4 border-t border-gray-800" onClick={e => e.stopPropagation()}>
          {prediction?.calculated ? (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Tahminin: {prediction.home_pred} - {prediction.away_pred}</p>
              <p className={`font-bold mt-1 ${prediction.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                +{prediction.points_earned} puan
              </p>
            </div>
          ) : prediction && !prediction.calculated ? (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Tahminin: {prediction.home_pred} - {prediction.away_pred}</p>
              <p className="text-gray-500 text-xs mt-1">Maç bekleniyor</p>
            </div>
          ) : saved ? (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Tahminin: {homePred} - {awayPred}</p>
              <p className="text-green-500 text-xs mt-1">✓ Kaydedildi — arkadaşların tahminlerini görmek için tıkla</p>
            </div>
          ) : canPredict ? (
            <div>
              <p className="text-gray-400 text-xs mb-2 text-center">Tahminini gir (bir kez kaydedilir, değiştirilemez)</p>
              <div className="flex items-center gap-3 justify-center">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homePred}
                  onChange={e => setHomePred(e.target.value)}
                  placeholder="0"
                  className="w-14 text-center bg-gray-800 text-white border border-gray-700 rounded-lg py-2 text-lg font-bold focus:border-green-500 focus:outline-none"
                />
                <span className="text-gray-500 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayPred}
                  onChange={e => setAwayPred(e.target.value)}
                  placeholder="0"
                  className="w-14 text-center bg-gray-800 text-white border border-gray-700 rounded-lg py-2 text-lg font-bold focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={savePrediction}
                  disabled={saving || homePred === '' || awayPred === ''}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
                >
                  {saving ? '...' : 'Kaydet'}
                </button>
              </div>
            </div>
          ) : isPast && !prediction ? (
            <p className="text-center text-gray-600 text-sm">Tahmin süresi geçti</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
