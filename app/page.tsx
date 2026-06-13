'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'
import Onboarding from '@/components/Onboarding'
import MatchCard from '@/components/MatchCard'
import LeagueSelector from '@/components/LeagueSelector'
import MiniLeaderboard from '@/components/MiniLeaderboard'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roundFilter, setRoundFilter] = useState<number | 'live'>(1)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchProfile(data.user.id)
        fetchPredictions(data.user.id)
        fetchGroups(data.user.id)
      }
    })
    fetchMatches()
    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchPredictions(session.user.id)
        fetchGroups(session.user.id)
      }
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function fetchGroups(userId: string) {
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name, invite_code)')
      .eq('user_id', userId)
    setGroups(data?.map((d: any) => d.groups) ?? [])
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true })
    setMatches(data ?? [])
    setLoading(false)
  }

  async function fetchPredictions(userId: string) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
    setPredictions(data ?? [])
  }

  async function syncMatches() {
    setSyncing(true)
    await fetch('/api/sync-matches')
    await fetchMatches()
    setSyncing(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setPredictions([])
    setGroups([])
  }

  if (!user) return <AuthForm />
  if (user && profile && !profile.username_confirmed) {
    return <Onboarding userId={user.id} onComplete={setProfile} />
  }

  const hasGroups = groups.length > 0
  const activeGroupId = profile?.active_group_id ?? null
  const needsLeagueSelection = hasGroups && !activeGroupId

  const liveMatches = matches.filter(m => m.status === 'live')
  const filteredMatches = roundFilter === 'live'
    ? liveMatches
    : matches.filter(m => m.matchday === roundFilter)

  const roundLabel = (r: number | 'live') => {
    if (r === 'live') return `🔴 Canlı${liveMatches.length > 0 ? ` (${liveMatches.length})` : ''}`
    return `${r}. Tur`
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="font-bold text-lg leading-none">WC 2026</h1>
              <p className="text-gray-400 text-xs">Tahmin Oyunu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <LeagueSelector
                userId={user.id}
                groups={groups}
                activeGroupId={activeGroupId}
                onSelect={(id) => setProfile((p: any) => ({ ...p, active_group_id: id }))}
              />
            )}
            <Link href="/groups" className="text-gray-400 hover:text-white text-sm transition-colors hidden sm:block">
              👥 Gruplar
            </Link>
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {profile?.avatar && (
                <img src={`/avatars/${profile.avatar}.svg`} alt="" className="w-9 h-9 rounded-full border border-gray-700" />
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{profile?.username}</p>
                <p className="text-green-400 text-xs font-bold">{profile?.total_points ?? 0} puan</p>
              </div>
            </Link>
            <button onClick={signOut} className="text-gray-500 hover:text-white text-sm transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Lig seçimi uyarısı */}
        {needsLeagueSelection && (
          <div className="bg-yellow-950 border border-yellow-700 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-yellow-300 font-semibold text-sm">Aktif lig seçilmedi</p>
              <p className="text-yellow-600 text-xs mt-0.5">Tahmin yapabilmek için yukarıdan bir lig seçmelisin.</p>
            </div>
            <Link href="/groups" className="bg-yellow-700 hover:bg-yellow-600 text-white text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
              Gruplara Git
            </Link>
          </div>
        )}

        {/* Aktif ligin mini puan tablosu */}
        {activeGroupId && (
          <MiniLeaderboard groupId={activeGroupId} userId={user.id} />
        )}

        {/* Tur sekmeleri */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 flex-wrap">
            {([1, 2, 3, 'live'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoundFilter(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roundFilter === r ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                {roundLabel(r)}
              </button>
            ))}
          </div>
          <button
            onClick={syncMatches}
            disabled={syncing}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {syncing ? '↻ Güncelleniyor...' : '↻ Güncelle'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Yükleniyor...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">
              {roundFilter === 'live' ? 'Şu an canlı maç yok.' : `${roundFilter}. tur maçları henüz yüklenmedi.`}
            </p>
            {matches.length === 0 && (
              <button onClick={syncMatches} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Maçları Yükle
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions.find(p => p.match_id === match.id)}
                userId={user.id}
                canPredict={!needsLeagueSelection}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
