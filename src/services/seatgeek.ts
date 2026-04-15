import type { Activity } from '../types'

const CLIENT_ID = import.meta.env.VITE_SEATGEEK_CLIENT_ID as string | undefined

const TYPE_TO_CATEGORY: Record<string, Activity['category']> = {
  concert: 'entertainment',
  music_festival: 'entertainment',
  theater: 'arts',
  broadway: 'arts',
  comedy: 'entertainment',
  sports: 'sports',
  nba: 'sports',
  nfl: 'sports',
  mlb: 'sports',
  nhl: 'sports',
  mls: 'sports',
  ncaa: 'sports',
  classical: 'arts',
  opera: 'arts',
  dance_performance: 'arts',
  film: 'arts',
  family: 'entertainment',
  circus: 'entertainment',
  festival: 'entertainment',
}

function mapType(type?: string): Activity['category'] {
  if (!type) return 'entertainment'
  const key = type.toLowerCase().replace(/-/g, '_')
  return TYPE_TO_CATEGORY[key] ?? 'entertainment'
}

function mapPrice(avg?: number): Activity['priceRange'] {
  if (!avg) return '$$'
  if (avg < 20) return '$'
  if (avg < 75) return '$$'
  return '$$$'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any): Activity {
  const venue = event.venue
  const performer = event.performers?.[0]

  return {
    id: `sg_${event.id}`,
    name: event.title,
    category: mapType(event.type),
    description:
      `${event.title} at ${venue?.name ?? 'a local venue'}. ` +
      (performer?.name ? `Featuring ${performer.name}. ` : '') +
      (event.description ?? 'A live event happening near you — grab your tickets before they sell out!'),
    lat: venue?.location?.lat ?? 40.7589,
    lng: venue?.location?.lon ?? -73.9851,
    address: [venue?.address, venue?.city, venue?.state]
      .filter(Boolean)
      .join(', '),
    rating: event.score ? Math.min(4 + event.score, 5) : 4.0 + Math.random() * 0.9,
    reviewCount: Math.floor(Math.random() * 500 + 50),
    reviews: [],
    tags: [
      event.type?.toLowerCase(),
      event.taxonomies?.[0]?.name?.toLowerCase(),
      'seatgeek',
      'live event',
    ].filter(Boolean),
    hours: event.datetime_local
      ? new Date(event.datetime_local).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'See event page',
    priceRange: mapPrice(event.stats?.average_price),
  }
}

export async function fetchSeatGeekEvents(
  lat: number,
  lng: number,
  query?: string
): Promise<Activity[]> {
  if (!CLIENT_ID) return []

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    lat: String(lat),
    lon: String(lng),
    range: '10mi',
    per_page: '20',
    sort: 'score.desc',
  })
  if (query) params.set('q', query)

  try {
    const res = await fetch(`https://api.seatgeek.com/2/events?${params}`)
    if (!res.ok) throw new Error(`SeatGeek ${res.status}`)
    const data = await res.json()
    return (data.events ?? []).map(transformEvent)
  } catch (err) {
    console.warn('[SeatGeek] fetch failed:', err)
    return []
  }
}
