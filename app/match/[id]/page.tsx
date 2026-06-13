'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MatchDetail() {
  const { id } = useParams()
  const [match, setMatch] = useState<any>(null)
  const [myPrediction, setMyPrediction] = useState<any>(null)
  const [groupPredictions, setGroupPredictions] = useState<any[]>([])
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

        const canSee = !!myPred || matchData?.status !== 'upcoming'
        if (canSee) {
          // Kullanıcının bulunduğu grupların üyelerini bul
          const { data: myGroupRows } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', uid)

          const groupIds = myGroupRows?.map((r: any) => r.group_id) ?? []

          if (groupIds.length > 0) {
            const { data: groupMemberRows } = await supabase
              .from('group_members')
              .select('user_id, groups(name)')
              .in('group_id', groupIds)

            const memberIds = [...new Set(groupMemberRows?.map((r: any) => r.user_id) ?? [])]

            const { data: preds } = await supabase
              .from('predictions')
              .select('*, profiles(username)')
              .eq('match_id', id)
              .in('user_id', memberIds)

            // Her kullanıcı için hangi gruplarda olduğunu bul
            const userGroupMap: Record<string, string[]> = {}
            groupMemberRows?.forEach((r: any) => {
              if (!userGroupMap[r.user_id]) userGroupMap[r.user_id] = []
              userGroupMap[r.user_id].push(r.groups?.name)
            })

            setGroupPredictions(
              (preds ?? []).map((p: any) => ({
                ...p,
                groups: userGroupMap[p.user_id] ?? [],
              })).sort((a: any, b: any) => b.points_earned - a.points_earned)
            )
          }
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
    live: { label: '🔴 Canlı', color: 'bg-red-600 animate-pulse' },
    finished: { label: 'Bitti', color: 'bg-gray-600' },
  }
  const statusBadge = statusMap[match.status] ?? { label: match.status, color: 'bg-gray-600' }

  const goals: any[] = match.goals ?? []
  const bookings: any[] = match.bookings ?? []
  const homeGoals = goals.filter((g: any) => g.team?.id === goals[0]?.team?.id ? false : false) // aşağıda düzgün yapıyoruz
  const yellowCards = bookings.filter((b: any) => b.card === 'YELLOW_CARD')
  const redCards = bookings.filter((b: any) => b.card === 'RED_CARD')

  // Golleri takıma göre ayır
  const allGoals = goals.map((g: any) => ({
    minute: g.minute,
    name: g.scorer?.name ?? 'Bilinmiyor',
    team: g.team?.name ?? '',
    type: g.type,
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Geri</Link>
          <h1 className="font-bold text-lg">Maç Detayı</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Skor kartı */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
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
                <div className="text-4xl font-bold text-white">{match.home_score} - {match.away_score}</div>
              ) : (
                <div className="text-gray-500 text-2xl font-bold">vs</div>
              )}
            </div>
            <div className="flex-1 text-center">
              {match.away_team_flag && <img src={match.away_team_flag} alt="" className="w-14 h-14 mx-auto mb-2 object-contain" />}
              <p className="text-white font-bold">{match.away_team}</p>
            </div>
          </div>

          {/* Kendi tahmini */}
          {myPrediction && (
            <div className="mt-5 pt-4 border-t border-gray-800 text-center">
              <p className="text-gray-400 text-xs mb-1">Senin tahminin</p>
              <p className="text-white font-bold text-2xl">{myPrediction.home_pred} - {myPrediction.away_pred}</p>
              {myPrediction.calculated && (
                <p className={`font-bold mt-1 ${myPrediction.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  +{myPrediction.points_earned} puan
                </p>
              )}
            </div>
          )}
        </div>

        {/* İstatistikler */}
        {match.status !== 'upcoming' && (allGoals.length > 0 || bookings.length > 0) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-gray-400 text-sm font-medium mb-4">Maç İstatistikleri</h2>

            {allGoals.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">⚽ Goller</p>
                <div className="space-y-1">
                  {allGoals.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-8 text-right">{g.minute}'</span>
                      <span className="text-white">{g.name}</span>
                      {g.type === 'OWN_GOAL' && <span className="text-red-400 text-xs">(kendi kalesine)</span>}
                      {g.type === 'PENALTY' && <span className="text-yellow-400 text-xs">(penaltı)</span>}
                      <span className="text-gray-600 text-xs ml-auto">{g.team}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(yellowCards.length > 0 || redCards.length > 0) && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Kartlar</p>
                <div className="space-y-1">
                  {yellowCards.map((b: any, i: number) => (
                    <div key={`y${i}`} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-8 text-right">{b.minute}'</span>
                      <span className="inline-block w-3 h-4 bg-yellow-400 rounded-sm"></span>
                      <span className="text-white">{b.player?.name ?? 'Bilinmiyor'}</span>
                      <span className="text-gray-600 text-xs ml-auto">{b.team?.name}</span>
                    </div>
                  ))}
                  {redCards.map((b: any, i: number) => (
                    <div key={`r${i}`} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-8 text-right">{b.minute}'</span>
                      <span className="inline-block w-3 h-4 bg-red-500 rounded-sm"></span>
                      <span className="text-white">{b.player?.name ?? 'Bilinmiyor'}</span>
                      <span className="text-gray-600 text-xs ml-auto">{b.team?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grup tahminleri */}
        {canSeeOthers ? (
          <div>
            <h2 className="text-gray-400 text-sm font-medium mb-3">
              Ligindeki Tahminler ({groupPredictions.length})
            </h2>
            {groupPredictions.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Henüz tahmin yok veya herhangi bir ligde değilsin.</p>
            ) : (
              <div className="space-y-2">
                {groupPredictions.map((pred: any) => (
                  <div
                    key={pred.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${pred.user_id === userId ? 'bg-green-950 border-green-800' : 'bg-gray-900 border-gray-800'}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {pred.profiles?.username}
                        {pred.user_id === userId && <span className="text-green-400 text-xs ml-1">(sen)</span>}
                      </p>
                      {pred.groups?.length > 0 && (
                        <p className="text-gray-600 text-xs">{pred.groups.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white text-lg">{pred.home_pred} - {pred.away_pred}</span>
                      {pred.calculated && (
                        <span className={`text-sm font-bold min-w-[40px] text-right ${pred.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
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
            <p className="text-3xl mb-3">🔒</p>
            <p className="text-white font-semibold mb-1">Arkadaşların Tahminleri</p>
            <p className="text-gray-400 text-sm">Kendi tahminini kaydettikten sonra diğerlerinin tahminlerini görebilirsin.</p>
          </div>
        )}
      </main>
    </div>
  )
}
