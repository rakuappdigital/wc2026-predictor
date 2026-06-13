'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AVATARS } from '@/lib/avatars'

interface Props {
  userId: string
  onComplete: (profile: any) => void
}

export default function Onboarding({ userId, onComplete }: Props) {
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!username.trim() || username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalı.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Sadece harf, rakam ve _ kullanabilirsin.')
      return
    }
    setSaving(true)
    setError('')

    const { data, error: err } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        avatar: selectedAvatar,
        username_confirmed: true,
      })
      .eq('id', userId)
      .select()
      .single()

    if (err) {
      if (err.code === '23505') setError('Bu kullanıcı adı alınmış, başka bir tane dene.')
      else setError(err.message)
      setSaving(false)
      return
    }

    onComplete(data)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-white">Profili Oluştur</h1>
          <p className="text-gray-400 text-sm mt-1">Bu bilgiler bir kez belirlenir ve değiştirilemez.</p>
        </div>

        {/* Kullanıcı adı */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Kullanıcı Adı</label>
          <input
            type="text"
            placeholder="örn: golazo_king"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            maxLength={20}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none text-lg"
          />
          <p className="text-gray-600 text-xs mt-1">3-20 karakter, harf/rakam/_ kullanabilirsin.</p>
        </div>

        {/* Avatar seç */}
        <div className="mb-8">
          <label className="text-gray-400 text-sm mb-3 block">Efsane Futbolcunu Seç</label>
          <div className="grid grid-cols-5 gap-3">
            {AVATARS.map(av => (
              <button
                key={av.slug}
                onClick={() => setSelectedAvatar(av.slug)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selectedAvatar === av.slug ? 'border-green-500 bg-green-950' : 'border-gray-700 hover:border-gray-500'}`}
              >
                <img
                  src={`/avatars/${av.slug}.svg`}
                  alt={av.name}
                  className="w-12 h-12"
                />
                <span className="text-xs text-gray-400 text-center leading-tight">{av.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seçilen avatar önizleme */}
        <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-4 mb-6">
          <img src={`/avatars/${selectedAvatar}.svg`} alt="" className="w-16 h-16" />
          <div>
            <p className="text-white font-bold text-lg">{username || 'Kullanıcı Adın'}</p>
            <p className="text-gray-400 text-sm">{AVATARS.find(a => a.slug === selectedAvatar)?.name}</p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !username.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-40"
        >
          {saving ? 'Kaydediliyor...' : 'Profili Oluştur →'}
        </button>
      </div>
    </div>
  )
}
