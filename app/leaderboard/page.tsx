'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [])

  const medals = ['👑', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Geri</Link>
          <h1 className="font-bold text-lg">🏆 Sıralama</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Yükleniyor...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Henüz kimse puan kazanmadı.</div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile, i) => (
              <div
                key={profile.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${i === 0 ? 'bg-yellow-950 border-yellow-800' : i === 1 ? 'bg-gray-800 border-gray-600' : i === 2 ? 'bg-orange-950 border-orange-800' : 'bg-gray-900 border-gray-800'}`}
              >
                <div className="w-8 text-center font-bold text-lg">
                  {i < 3 ? medals[i] : <span className="text-gray-500 text-sm">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{profile.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">{profile.total_points}</p>
                  <p className="text-gray-500 text-xs">puan</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
