'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AVATARS } from '@/lib/avatars'
import Link from 'next/link'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [editingAvatar, setEditingAvatar] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [savingAvatar, setSavingAvatar] = useState(false)

  const [deleteStep, setDeleteStep] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)
      setSelectedAvatar(profileData?.avatar ?? 'ronaldo')

      const { data: preds } = await supabase
        .from('predictions')
        .select('*, matches(home_team, away_team, home_score, away_score, status, kickoff_time, home_team_flag, away_team_flag)')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
      setPredictions(preds ?? [])

      const { data: groupRows } = await supabase
        .from('group_members')
        .select('groups(id, name, invite_code)')
        .eq('user_id', data.user.id)
      setGroups(groupRows?.map((r: any) => r.groups) ?? [])

      setLoading(false)
    })
  }, [])

  async function saveAvatar() {
    if (!user) return
    setSavingAvatar(true)
    const { data } = await supabase
      .from('profiles')
      .update({ avatar: selectedAvatar })
      .eq('id', user.id)
      .select()
      .single()
    setProfile(data)
    setSavingAvatar(false)
    setEditingAvatar(false)
  }

  async function deleteAccount() {
    if (!user) return
    setDeleting(true)
    await supabase.auth.signOut()
    await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Yükleniyor...</div>
  )

  const totalPredictions = predictions.length
  const calculatedPreds = predictions.filter(p => p.calculated)
  const correctResults = calculatedPreds.filter(p => p.points_earned >= 3).length
  const exactScores = calculatedPreds.filter(p => p.points_earned === 7).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Ana Sayfa</Link>
          <h1 className="font-bold text-lg">Profil</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Profil kartı */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={`/avatars/${profile?.avatar ?? 'ronaldo'}.svg`}
                alt=""
                className="w-20 h-20 rounded-full border-2 border-gray-700"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.username}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-green-400 font-bold text-lg mt-1">{profile?.total_points ?? 0} puan</p>
            </div>
            <button
              onClick={() => setEditingAvatar(true)}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-lg transition-colors"
            >
              Avatar Değiştir
            </button>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalPredictions}</p>
              <p className="text-gray-500 text-xs">Tahmin</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{correctResults}</p>
              <p className="text-gray-500 text-xs">Doğru Sonuç</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{exactScores}</p>
              <p className="text-gray-500 text-xs">Tam Skor</p>
            </div>
          </div>
        </div>

        {/* Avatar düzenleme modal */}
        {editingAvatar && (
          <div className="bg-gray-900 border border-green-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Avatar Seç</h3>
            <div className="grid grid-cols-5 gap-3 mb-5">
              {AVATARS.map(av => (
                <button
                  key={av.slug}
                  onClick={() => setSelectedAvatar(av.slug)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selectedAvatar === av.slug ? 'border-green-500 bg-green-950' : 'border-gray-700 hover:border-gray-500'}`}
                >
                  <img src={`/avatars/${av.slug}.svg`} alt={av.name} className="w-12 h-12" />
                  <span className="text-xs text-gray-400 text-center leading-tight">{av.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveAvatar}
                disabled={savingAvatar}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {savingAvatar ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => { setEditingAvatar(false); setSelectedAvatar(profile?.avatar ?? 'ronaldo') }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Ligler */}
        <div>
          <h3 className="text-gray-400 text-sm font-medium mb-3">Kayıtlı Olduğun Ligler</h3>
          {groups.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">Henüz bir ligde değilsin.</p>
              <Link href="/groups" className="text-green-400 text-sm hover:underline mt-1 inline-block">Grup oluştur veya katıl →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(group => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors"
                >
                  <span className="font-medium">{group.name}</span>
                  <span className="text-gray-500 text-sm font-mono">{group.invite_code}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tahmin geçmişi */}
        <div>
          <h3 className="text-gray-400 text-sm font-medium mb-3">Tahmin Geçmişi ({totalPredictions})</h3>
          {predictions.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Henüz tahmin yapmadın.</p>
          ) : (
            <div className="space-y-2">
              {predictions.map(pred => {
                const match = pred.matches
                if (!match) return null
                const kickoff = new Date(match.kickoff_time)
                return (
                  <Link
                    key={pred.id}
                    href={`/match/${pred.match_id}`}
                    className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.home_team_flag && <img src={match.home_team_flag} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                      <span className="text-sm text-white truncate">{match.home_team}</span>
                      <span className="text-gray-500 text-xs flex-shrink-0">vs</span>
                      <span className="text-sm text-white truncate">{match.away_team}</span>
                      {match.away_team_flag && <img src={match.away_team_flag} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold text-sm">{pred.home_pred} - {pred.away_pred}</p>
                      {match.status === 'finished' && (
                        <p className="text-gray-500 text-xs">{match.home_score} - {match.away_score}</p>
                      )}
                    </div>
                    {pred.calculated && (
                      <div className={`text-sm font-bold min-w-[40px] text-right flex-shrink-0 ${pred.points_earned > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                        +{pred.points_earned}p
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Hesap silme */}
        <div className="border-t border-gray-800 pt-6">
          {deleteStep === 0 && (
            <button onClick={() => setDeleteStep(1)} className="text-red-500 hover:text-red-400 text-sm transition-colors">
              Hesabı Sil
            </button>
          )}
          {deleteStep === 1 && (
            <div className="bg-red-950 border border-red-800 rounded-xl p-4">
              <p className="text-white font-semibold mb-1">Hesabını silmek istediğine emin misin?</p>
              <p className="text-gray-400 text-sm mb-4">Tüm tahminlerin ve puanların kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteStep(2)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Evet, silmek istiyorum
                </button>
                <button onClick={() => setDeleteStep(0)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  İptal
                </button>
              </div>
            </div>
          )}
          {deleteStep === 2 && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-4">
              <p className="text-white font-semibold mb-1">Son onay</p>
              <p className="text-red-300 text-sm mb-4">Hesabın ve tüm verilerin kalıcı olarak silinecek.</p>
              <div className="flex gap-3">
                <button onClick={deleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {deleting ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
                </button>
                <button onClick={() => setDeleteStep(0)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
