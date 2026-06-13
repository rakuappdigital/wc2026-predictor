const BASE_URL = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!

export async function fetchWC2026Matches() {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Football API error: ${res.status}`)
  return res.json()
}

export async function fetchWC2026Standings() {
  const res = await fetch(`${BASE_URL}/competitions/WC/standings`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Football API error: ${res.status}`)
  return res.json()
}
