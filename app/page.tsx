'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'
import Onboarding from '@/components/Onboarding'
import MatchCard from '@/components/MatchCard'
import LeagueSelector from '@/components/LeagueSelector'
import MiniLeaderboard from '@/components/MiniLeaderboard'
import ThemeToggle from '@/components/ThemeToggle'
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
    <div className="min-h-screen bg-theme text-theme">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-theme" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-black text-base leading-none tracking-tight" style={{ color: 'var(--text)' }}>WC 2026</p>
              <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Tahmin Oyunu</p>
            </div>
          </Link>

          {/* Sağ taraf */}
          <div className="flex items-center gap-2">
            {profile && (
              <LeagueSelector
                userId={user.id}
                groups={groups}
                activeGroupId={activeGroupId}
                onSelect={(id) => setProfile((p: any) => ({ ...p, active_group_id: id }))}
              />
            )}

            <Link
              href="/groups"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-theme hover:border-theme2 transition-all"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Gruplar
            </Link>

            <ThemeToggle />

            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {profile?.avatar
                ? <img src={`/avatars/${profile.avatar}.svg`} alt="" className="w-9 h-9 rounded-full border border-theme" />
                : <div className="w-9 h-9 rounded-full border border-theme" style={{ background: 'var(--bg-card2)' }} />
              }
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>{profile?.username}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--green)' }}>{profile?.total_points ?? 0} puan</p>
              </div>
            </Link>

            <button
              onClick={signOut}
              title="Çıkış"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-theme hover:border-theme2 transition-all"
              style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-7">

        {/* Lig seçimi uyarısı */}
        {needsLeagueSelection && (
          <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 border"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--gold)' }}>Aktif lig seçilmedi</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tahmin yapabilmek için yukarıdan bir lig seçmelisin.</p>
            </div>
            <Link href="/groups" className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              style={{ background: 'var(--gold)', color: '#000' }}>
              Gruplara Git
            </Link>
          </div>
        )}

        {/* Mini puan tablosu */}
        {activeGroupId && <MiniLeaderboard groupId={activeGroupId} userId={user.id} />}

        {/* Tur sekmeleri */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {([1, 2, 3, 'live'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoundFilter(r)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={roundFilter === r
                  ? { background: 'var(--green)', color: '#fff' }
                  : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {roundLabel(r)}
              </button>
            ))}
          </div>
          <button
            onClick={syncMatches}
            disabled={syncing}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-theme transition-all disabled:opacity-40 flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              className={syncing ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {syncing ? 'Güncelleniyor' : 'Güncelle'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-24">
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              {roundFilter === 'live' ? 'Şu an canlı maç yok.' : `${roundFilter}. tur maçları yüklenmedi.`}
            </p>
            {matches.length === 0 && (
              <button onClick={syncMatches}
                className="px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ background: 'var(--green)', color: '#fff' }}>
                Maçları Yükle
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
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
