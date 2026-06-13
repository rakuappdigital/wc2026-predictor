'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
      if (error) setMessage(error.message)
      else setMessage('Kayıt başarılı! Giriş yapabilirsin.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-theme">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>WC 2026 Tahmin</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Dünya Kupası tahmin oyunu</p>
        </div>

        {/* Kart */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* Sekme */}
          <div className="flex mb-6 rounded-xl p-1 gap-1" style={{ background: 'var(--bg-card2)' }}>
            {['Giriş Yap', 'Kayıt Ol'].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={isLogin === (i === 0)
                  ? { background: 'var(--green)', color: '#fff' }
                  : { color: 'var(--text-muted)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <input
                type="text"
                placeholder="Kullanıcı adı"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            )}
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#fff' }}
            >
              {loading ? 'Yükleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm" style={{ color: 'var(--gold)' }}>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
