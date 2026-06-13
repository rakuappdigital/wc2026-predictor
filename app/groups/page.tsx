'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Groups() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUserId(data.user.id)
      fetchMyGroups(data.user.id)
    })
  }, [])

  async function fetchMyGroups(uid: string) {
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name, invite_code, created_by)')
      .eq('user_id', uid)
    setMyGroups(data?.map((d: any) => d.groups) ?? [])
    setLoading(false)
  }

  async function createGroup() {
    if (!userId || !groupName.trim()) return
    setCreating(true)
    setError('')
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), created_by: userId })
      .select()
      .single()

    if (error) { setError(error.message); setCreating(false); return }

    await supabase.from('group_members').insert({ group_id: data.id, user_id: userId })
    setGroupName('')
    setCreating(false)
    router.push(`/groups/${data.id}`)
  }

  async function joinGroup() {
    if (!userId || !inviteCode.trim()) return
    setJoining(true)
    setError('')

    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (!group) { setError('Grup bulunamadı. Kodu kontrol et.'); setJoining(false); return }

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId })

    if (error && error.code !== '23505') { setError(error.message); setJoining(false); return }

    setInviteCode('')
    setJoining(false)
    router.push(`/groups/${group.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Geri</Link>
          <h1 className="font-bold text-lg">👥 Gruplar</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Grup oluştur */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Yeni Grup Oluştur</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Grup adı"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={createGroup}
              disabled={creating || !groupName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
            >
              {creating ? '...' : 'Oluştur'}
            </button>
          </div>
        </div>

        {/* Gruba katıl */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Gruba Katıl</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Davet kodu (ör: AB12CD34)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none uppercase"
            />
            <button
              onClick={joinGroup}
              disabled={joining || !inviteCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
            >
              {joining ? '...' : 'Katıl'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Gruplarım */}
        <div>
          <h2 className="text-gray-400 text-sm font-medium mb-3">Gruplarım</h2>
          {loading ? (
            <p className="text-gray-600 text-sm">Yükleniyor...</p>
          ) : myGroups.length === 0 ? (
            <p className="text-gray-600 text-sm">Henüz bir gruba dahil değilsin.</p>
          ) : (
            <div className="space-y-2">
              {myGroups.map(group => (
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
      </main>
    </div>
  )
}
