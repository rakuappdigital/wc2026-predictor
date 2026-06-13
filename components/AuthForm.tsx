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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) setMessage(error.message)
      else setMessage('Kayıt başarılı! Giriş yapabilirsin.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-white">WC 2026 Tahmin</h1>
          <p className="text-gray-400 text-sm mt-1">Dünya Kupası tahmin oyunu</p>
        </div>

        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-yellow-400">{message}</p>
        )}
      </div>
    </div>
  )
}
