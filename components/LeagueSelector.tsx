'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Group {
  id: number
  name: string
  invite_code: string
}

interface Props {
  userId: string
  groups: Group[]
  activeGroupId: number | null
  onSelect: (groupId: number | null, groupName: string | null) => void
}

export default function LeagueSelector({ userId, groups, activeGroupId, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeGroup = groups.find(g => g.id === activeGroupId)
  const label = activeGroupId === null
    ? groups.length === 0 ? '🎮 Single Mod' : 'Lig Seç'
    : `🏆 ${activeGroup?.name ?? 'Lig'}`

  async function select(groupId: number | null) {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ active_group_id: groupId })
      .eq('id', userId)
    onSelect(groupId, groups.find(g => g.id === groupId)?.name ?? null)
    setSaving(false)
    setOpen(false)
  }

  if (groups.length === 0) {
    return (
      <span className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg">
        🎮 Single Mod
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${activeGroupId ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-yellow-900 text-yellow-300 border border-yellow-700 animate-pulse'}`}
      >
        {saving ? '...' : label}
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-gray-900 border border-gray-700 rounded-xl shadow-xl min-w-[200px] overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800">
              <p className="text-xs text-gray-500">Aktif Lig Seç</p>
            </div>
            <div className="py-1">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => select(g.id)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${activeGroupId === g.id ? 'text-green-400 font-semibold' : 'text-white'}`}
                >
                  <span>{g.name}</span>
                  {activeGroupId === g.id && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
