'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  groupId: number
  userId: string
}

export default function MiniLeaderboard({ groupId, userId }: Props) {
  const [members, setMembers] = useState<any[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: groupData } = await supabase.from('groups').select('name').eq('id', groupId).single()
      setGroupName(groupData?.name ?? '')
      const { data } = await supabase
        .from('group_members')
        .select('profiles(id, username, total_points, avatar)')
        .eq('group_id', groupId)
      const sorted = (data ?? [])
        .map((d: any) => d.profiles)
        .sort((a: any, b: any) => b.total_points - a.total_points)
      setMembers(sorted)
      setLoading(false)
    }
    load()
  }, [groupId])

  if (loading) return null

  const medals = ['👑', '🥈', '🥉']

  return (
    <div className="rounded-2xl border mb-5 overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--green)' }}>Lig</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{groupName}</span>
        </div>
        <Link href={`/groups/${groupId}`} className="text-xs font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>
          Tümü →
        </Link>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {members.slice(0, 5).map((member, i) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors"
            style={member.id === userId ? { background: 'rgba(16,185,129,0.08)' } : {}}
          >
            <span className="text-sm w-5 text-center flex-shrink-0">
              {i < 3 ? medals[i] : <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>}
            </span>
            {member.avatar
              ? <img src={`/avatars/${member.avatar}.svg`} alt="" className="w-7 h-7 rounded-full border border-theme flex-shrink-0" />
              : <div className="w-7 h-7 rounded-full border border-theme flex-shrink-0" style={{ background: 'var(--bg-card2)' }} />
            }
            <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {member.username}
              {member.id === userId && <span className="ml-1 text-xs font-normal" style={{ color: 'var(--green)' }}>(sen)</span>}
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--green)' }}>{member.total_points}p</span>
          </div>
        ))}
      </div>
    </div>
  )
}
