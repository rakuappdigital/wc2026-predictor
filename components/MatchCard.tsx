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
  matchday?: number | null
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
  canPredict?: boolean
}

export default function MatchCard({ match, prediction, userId, canPredict: leagueSelected = true }: Props) {
  const router = useRouter()
  const [homePred, setHomePred] = useState('')
  const [awayPred, setAwayPred] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)

  const kickoff = new Date(match.kickoff_time)
  const isPast = kickoff < new Date()
  const canPredict = !isPast && userId && match.status === 'upcoming' && !prediction && leagueSelected

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

  const isClickable = saved || !!prediction || match.status !== 'upcoming'

  const statusConfig = {
    upcoming: { label: 'Yaklaşan', dot: 'bg-blue-500' },
    live:     { label: 'Canlı',    dot: 'bg-red-500 animate-pulse' },
    finished: { label: 'Bitti',    dot: 'bg-gray-500' },
  }[match.status] ?? { label: match.status, dot: 'bg-gray-500' }

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all ${isClickable ? 'cursor-pointer hover:border-theme2' : ''}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      onClick={isClickable ? () => router.push(`/match/${match.id}`) : undefined}
    >
      {/* Tur rozeti — sağ üst köşe */}
      {match.matchday && (
        <div className="absolute top-0 right-0">
          <div
            className="text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider"
            style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
          >
            {match.matchday}. TUR
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Üst satır: durum + saat */}
        <div className="flex items-center gap-2 mb-5 pr-16">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{statusConfig.label}</span>
          <span className="mx-1" style={{ color: 'var(--border2)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {kickoff.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Takımlar + skor */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center gap-2">
            {match.home_team_flag
              ? <img src={match.home_team_flag} alt="" className="w-10 h-10 object-contain drop-shadow" />
              : <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-card2)' }} />
            }
            <p className="text-sm font-semibold text-center leading-tight" style={{ color: 'var(--text)' }}>{match.home_team}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            {match.status !== 'upcoming' ? (
              <div className="text-3xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
                {match.home_score}<span className="mx-1 opacity-30">:</span>{match.away_score}
              </div>
            ) : (
              <div className="text-xl font-bold" style={{ color: 'var(--border2)' }}>vs</div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            {match.away_team_flag
              ? <img src={match.away_team_flag} alt="" className="w-10 h-10 object-contain drop-shadow" />
              : <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-card2)' }} />
            }
            <p className="text-sm font-semibold text-center leading-tight" style={{ color: 'var(--text)' }}>{match.away_team}</p>
          </div>
        </div>

        {/* Tahmin bölümü */}
        {userId && (
          <div
            className="mt-4 pt-4 border-t"
            style={{ borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {prediction?.calculated ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Tahminin</p>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{prediction.home_pred} – {prediction.away_pred}</p>
                </div>
                <div className={`text-lg font-black ${prediction.points_earned > 0 ? 'text-green' : ''}`}
                  style={{ color: prediction.points_earned > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                  +{prediction.points_earned}p
                </div>
              </div>
            ) : prediction ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Tahminin</p>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{prediction.home_pred} – {prediction.away_pred}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Maç bekleniyor</p>
              </div>
            ) : saved ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Tahminin kaydedildi</p>
                  <p className="font-bold" style={{ color: 'var(--green)' }}>{homePred} – {awayPred}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--green)' }}>✓ Detayı gör →</p>
              </div>
            ) : canPredict ? (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Tahmini gir — bir kez kaydedilir</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="0" max="20"
                    value={homePred}
                    onChange={e => setHomePred(e.target.value)}
                    placeholder="0"
                    className="w-14 text-center rounded-xl py-2.5 text-lg font-bold focus:outline-none"
                    style={{ background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border2)' }}
                  />
                  <span className="text-lg font-bold" style={{ color: 'var(--border2)' }}>–</span>
                  <input
                    type="number" min="0" max="20"
                    value={awayPred}
                    onChange={e => setAwayPred(e.target.value)}
                    placeholder="0"
                    className="w-14 text-center rounded-xl py-2.5 text-lg font-bold focus:outline-none"
                    style={{ background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border2)' }}
                  />
                  <button
                    onClick={savePrediction}
                    disabled={saving || homePred === '' || awayPred === ''}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                    style={{ background: 'var(--green)', color: '#fff' }}
                  >
                    {saving ? '...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            ) : isPast && !prediction ? (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Tahmin süresi geçti</p>
            ) : !leagueSelected ? (
              <p className="text-xs text-center" style={{ color: 'var(--gold)' }}>Tahmin için önce lig seç</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
