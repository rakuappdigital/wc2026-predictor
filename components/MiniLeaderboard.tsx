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
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single()
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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-white">{groupName}</h2>
        <Link href={`/groups/${groupId}`} className="text-xs text-green-400 hover:underline">
          Tümünü gör →
        </Link>
      </div>
      <div className="space-y-2">
        {members.slice(0, 5).map((member, i) => (
          <div
            key={member.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl ${member.id === userId ? 'bg-green-950 border border-green-800' : 'bg-gray-800'}`}
          >
            <span className="text-sm w-5 text-center">
              {i < 3 ? medals[i] : <span className="text-gray-500 text-xs">{i + 1}</span>}
            </span>
            {member.avatar && (
              <img src={`/avatars/${member.avatar}.svg`} alt="" className="w-7 h-7 rounded-full border border-gray-700" />
            )}
            <span className="flex-1 text-sm font-medium truncate">
              {member.username}
              {member.id === userId && <span className="text-green-400 text-xs ml-1">(sen)</span>}
            </span>
            <span className="text-green-400 text-sm font-bold">{member.total_points}p</span>
          </div>
        ))}
        {members.length > 5 && (
          <p className="text-center text-gray-600 text-xs pt-1">+{members.length - 5} kişi daha</p>
        )}
      </div>
    </div>
  )
}
