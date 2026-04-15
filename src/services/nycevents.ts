import type { Activity } from '../types'

const BASE_URL = 'https://new-york-events-66105853a688.herokuapp.com'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any): Activity {
  return {
    id: `nyc_${event.id}`,
    name: event.name ?? 'NYC Event',
    category: 'entertainment',
    description: event.desc ?? `An event happening in New York City at ${event.place ?? 'a local venue'}.`,
    lat: 40.7589 + (Math.random() - 0.5) * 0.1,
    lng: -73.9851 + (Math.random() - 0.5) * 0.1,
    address: event.place ?? 'New York, NY',
    rating: 4.0 + Math.random() * 0.9,
    reviewCount: Math.floor(Math.random() * 100 + 5),
    reviews: [],
    tags: ['nyc', 'local', 'event'],
    hours: 'See event page',
    priceRange: 'Free',
    image: event.img ?? undefined,
  }
}

export async function fetchNYCEvents(): Promise<Activity[]> {
  try {
    const res = await fetch(`${BASE_URL}/get-all-events`)
    if (!res.ok) throw new Error(`NYC Events API ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data.map(transformEvent) : []
  } catch (err) {
    console.warn('[NYCEvents] fetch failed:', err)
    return []
  }
}
