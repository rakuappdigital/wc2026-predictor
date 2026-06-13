'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function GroupDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [leaveStep, setLeaveStep] = useState(0) // 0=gizli, 1=ilk onay, 2=son onay
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null)

      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      setGroup(groupData)

      await loadMembers()
      setLoading(false)
    })
  }, [id])

  async function loadMembers() {
    const { data: memberData } = await supabase
      .from('group_members')
      .select('profiles(id, username, total_points)')
      .eq('group_id', id)

    const sorted = (memberData ?? [])
      .map((m: any) => m.profiles)
      .sort((a: any, b: any) => b.total_points - a.total_points)
    setMembers(sorted)
  }

  function copyCode() {
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function leaveGroup() {
    if (!userId) return
    setLeaving(true)
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', userId)
    setLeaving(false)
    router.push('/groups')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Yükleniyor...</div>
  )
  if (!group) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Grup bulunamadı.</div>
  )

  const topPoints = members[0]?.total_points ?? 0

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
            <button onClick={copyCode} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors">
              {copied ? '✓ Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>

        {/* Liderboard */}
        <h2 className="text-gray-400 text-sm font-medium mb-3">Sıralama ({members.length} üye)</h2>
        <div className="space-y-2 mb-8">
          {members.map((member, i) => {
            const isLeader = member.total_points === topPoints && topPoints > 0
            const isMe = member.id === userId

            return (
              <div
                key={member.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isMe ? 'bg-green-950 border-green-800' : i === 0 ? 'bg-yellow-950 border-yellow-800' : 'bg-gray-900 border-gray-800'}`}
              >
                <div className="w-8 text-center text-lg">
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-500 text-sm">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {member.username}
                    {isMe && <span className="text-green-400 text-xs ml-1">(sen)</span>}
                    {isLeader && i === 0 && <span className="text-yellow-400 text-xs ml-1">lider</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">{member.total_points}</p>
                  <p className="text-gray-500 text-xs">puan</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ligden ayrıl */}
        <div className="border-t border-gray-800 pt-6">
          {leaveStep === 0 && (
            <button
              onClick={() => setLeaveStep(1)}
              className="text-red-500 hover:text-red-400 text-sm transition-colors"
            >
              Ligden ayrıl
            </button>
          )}
          {leaveStep === 1 && (
            <div className="bg-red-950 border border-red-800 rounded-xl p-4">
              <p className="text-white font-semibold mb-1">Emin misin?</p>
              <p className="text-gray-400 text-sm mb-4">
                <strong>{group.name}</strong> liginden ayrılacaksın. Puanların korunur ama bu ligdeki sıralamadan çıkarsın.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLeaveStep(2)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Evet, ayrılmak istiyorum
                </button>
                <button
                  onClick={() => setLeaveStep(0)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
          {leaveStep === 2 && (
            <div className="bg-red-950 border border-red-700 rounded-xl p-4">
              <p className="text-white font-semibold mb-1">Son onay</p>
              <p className="text-red-300 text-sm mb-4">Bu işlem geri alınamaz. Tekrar katılmak için davet koduna ihtiyacın olacak.</p>
              <div className="flex gap-3">
                <button
                  onClick={leaveGroup}
                  disabled={leaving}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {leaving ? 'Ayrılıyor...' : 'Evet, kesinlikle ayrıl'}
                </button>
                <button
                  onClick={() => setLeaveStep(0)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
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
