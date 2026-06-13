'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MatchDetail() {
  const { id } = useParams()
  const [match, setMatch] = useState<any>(null)
  const [myPrediction, setMyPrediction] = useState<any>(null)
  const [allPredictions, setAllPredictions] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()
      setMatch(matchData)

      if (uid) {
        const { data: myPred } = await supabase
          .from('predictions')
          .select('*')
          .eq('match_id', id)
          .eq('user_id', uid)
          .single()
        setMyPrediction(myPred)

        const isFinished = matchData?.status !== 'upcoming'
        if (myPred || isFinished) {
          const { data: preds } = await supabase
            .from('predictions')
            .select('*, profiles(username)')
            .eq('match_id', id)
            .order('points_earned', { ascending: false })
          setAllPredictions(preds ?? [])
        }
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Yükleniyor...</div>
  )

  if (!match) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Maç bulunamadı.</div>
  )

  const kickoff = new Date(match.kickoff_time)
  const canSeeOthers = !!myPrediction || match.status !== 'upcoming'

  const statusMap: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'Yaklaşan', color: 'bg-blue-600' },
    live: { label: '🔴 Canlı', color: 'bg-red-600' },
    finished: { label: 'Bitti', color: 'bg-gray-600' },
  }
  const statusBadge = statusMap[match.status] ?? { label: match.status, color: 'bg-gray-600' }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Geri</Link>
          <h1 className="font-bold text-lg">Maç Detayı</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Maç kartı */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
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
              {match.home_team_flag && <img src={match.home_team_flag} alt="" className="w-14 h-14 mx-auto mb-2 object-contain" />}
              <p className="text-white font-bold">{match.home_team}</p>
            </div>
            <div className="text-center">
              {match.status !== 'upcoming' ? (
                <div className="text-3xl font-bold text-white">{match.home_score} - {match.away_score}</div>
              ) : (
                <div className="text-gray-500 text-xl font-bold">vs</div>
              )}
            </div>
            <div className="flex-1 text-center">
              {match.away_team_flag && <img src={match.away_team_flag} alt="" className="w-14 h-14 mx-auto mb-2 object-contain" />}
              <p className="text-white font-bold">{match.away_team}</p>
            </div>
          </div>

          {/* Kendi tahmini */}
          {myPrediction && (
            <div className="mt-4 pt-4 border-t border-gray-800 text-center">
              <p className="text-gray-400 text-sm">Senin tahminin</p>
              <p className="text-white font-bold text-xl mt-1">{myPrediction.home_pred} - {myPrediction.away_pred}</p>
              {myPrediction.calculated && (
                <p className={`font-bold mt-1 ${myPrediction.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  +{myPrediction.points_earned} puan
                </p>
              )}
            </div>
          )}
        </div>

        {/* Diğer tahminler */}
        {canSeeOthers ? (
          <div>
            <h2 className="text-gray-400 text-sm font-medium mb-3">
              Tüm Tahminler ({allPredictions.length})
            </h2>
            {allPredictions.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Henüz tahmin yok.</p>
            ) : (
              <div className="space-y-2">
                {allPredictions.map(pred => (
                  <div key={pred.id} className={`flex items-center justify-between p-4 rounded-xl border ${pred.user_id === userId ? 'bg-green-950 border-green-800' : 'bg-gray-900 border-gray-800'}`}>
                    <span className="font-medium text-sm">{pred.profiles?.username}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white">{pred.home_pred} - {pred.away_pred}</span>
                      {pred.calculated && (
                        <span className={`text-sm font-bold ${pred.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          +{pred.points_earned}p
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-2xl mb-3">🔒</p>
            <p className="text-white font-semibold mb-1">Arkadaşların Tahminleri</p>
            <p className="text-gray-400 text-sm">Kendi tahminini kaydettikten sonra diğerlerinin tahminlerini görebilirsin.</p>
          </div>
        )}
      </main>
    </div>
  )
}
