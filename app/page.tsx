'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'
import MatchCard from '@/components/MatchCard'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'live' | 'finished'>('upcoming')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        fetchProfile(data.user.id)
        fetchPredictions(data.user.id)
      }
    })
    fetchMatches()
    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchPredictions(session.user.id)
      }
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
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
  }

  if (!user) return <AuthForm />

  const filteredMatches = matches.filter(m => m.status === filter)

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
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition-colors">
              🏆 Sıralama
            </Link>
            <div className="text-right">
              <p className="text-sm font-semibold">{profile?.username}</p>
              <p className="text-green-400 text-xs font-bold">{profile?.total_points ?? 0} puan</p>
            </div>
            <button onClick={signOut} className="text-gray-500 hover:text-white text-sm transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {(['upcoming', 'live', 'finished'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                {f === 'upcoming' ? 'Yaklaşan' : f === 'live' ? '🔴 Canlı' : 'Biten'}
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
              {filter === 'upcoming' ? 'Yaklaşan maç yok.' : filter === 'live' ? 'Şu an canlı maç yok.' : 'Biten maç yok.'}
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
