'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function GroupDetail() {
  const { id } = useParams()
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null)

      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      setGroup(groupData)

      const { data: memberData } = await supabase
        .from('group_members')
        .select('profiles(id, username, total_points)')
        .eq('group_id', id)

      const sorted = (memberData ?? [])
        .map((m: any) => m.profiles)
        .sort((a: any, b: any) => b.total_points - a.total_points)
      setMembers(sorted)
      setLoading(false)
    })
  }, [id])

  function copyCode() {
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Yükleniyor...</div>
  )

  if (!group) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Grup bulunamadı.</div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/groups" className="text-gray-400 hover:text-white transition-colors">← Gruplar</Link>
          <h1 className="font-bold text-lg">{group.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Davet kodu */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-gray-400 text-sm mb-2">Arkadaşlarını davet et</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-white tracking-widest">{group.invite_code}</span>
            <button
              onClick={copyCode}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors"
            >
              {copied ? '✓ Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>

        {/* Liderboard */}
        <h2 className="text-gray-400 text-sm font-medium mb-3">Sıralama ({members.length} üye)</h2>
        <div className="space-y-2">
          {members.map((member, i) => (
            <div
              key={member.id}
              className={`flex items-center gap-4 p-4 rounded-xl border ${member.id === userId ? 'bg-green-950 border-green-800' : i === 0 ? 'bg-yellow-950 border-yellow-800' : 'bg-gray-900 border-gray-800'}`}
            >
              <div className="w-8 text-center font-bold text-lg">
                {i < 3 ? medals[i] : <span className="text-gray-500 text-sm">{i + 1}</span>}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{member.username} {member.id === userId && <span className="text-green-400 text-xs">(sen)</span>}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-lg">{member.total_points}</p>
                <p className="text-gray-500 text-xs">puan</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
