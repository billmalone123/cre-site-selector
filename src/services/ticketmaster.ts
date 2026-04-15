import type { Activity } from '../types'

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY as string | undefined

const CATEGORY_MAP: Record<string, Activity['category']> = {
  'KZFzniwnSyZfZ7v7nJ': 'arts',       // Arts & Theatre
  'KZFzniwnSyZfZ7v7nE': 'entertainment', // Film / Miscellaneous
  'KZFzniwnSyZfZ7v7n1': 'entertainment', // Music
  'KZFzniwnSyZfZ7v7na': 'sports',     // Sports
  'KZFzniwnSyZfZ7v7nn': 'entertainment', // Family
}

function mapSegmentToCategory(segmentId?: string): Activity['category'] {
  if (!segmentId) return 'entertainment'
  return CATEGORY_MAP[segmentId] ?? 'entertainment'
}

function priceRange(min?: number): Activity['priceRange'] {
  if (!min) return '$$'
  if (min === 0) return 'Free'
  if (min < 20) return '$'
  if (min < 60) return '$$'
  return '$$$'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any): Activity {
  const venue = event._embedded?.venues?.[0]
  const lat = parseFloat(venue?.location?.latitude ?? '0')
  const lng = parseFloat(venue?.location?.longitude ?? '0')
  const segment = event.classifications?.[0]?.segment
  const minPrice = event.priceRanges?.[0]?.min

  return {
    id: `tm_${event.id}`,
    name: event.name,
    category: mapSegmentToCategory(segment?.id),
    description:
      event.info ??
      event.pleaseNote ??
      `${event.name} at ${venue?.name ?? 'a local venue'}. Check out this live event happening near you!`,
    lat: isNaN(lat) ? 40.7589 : lat,
    lng: isNaN(lng) ? -73.9851 : lng,
    address: venue
      ? `${venue.address?.line1 ?? ''}, ${venue.city?.name ?? ''}, ${venue.state?.stateCode ?? ''}`.trim().replace(/^,\s*/, '')
      : 'Venue TBD',
    rating: 4.0 + Math.random() * 0.9, // Ticketmaster doesn't expose ratings
    reviewCount: Math.floor(Math.random() * 300 + 50),
    reviews: [],
    tags: [
      segment?.name?.toLowerCase() ?? 'event',
      event.classifications?.[0]?.genre?.name?.toLowerCase() ?? 'live',
      'ticketmaster',
    ].filter(Boolean),
    hours: event.dates?.start?.localDate
      ? `${event.dates.start.localDate}${event.dates.start.localTime ? ' · ' + event.dates.start.localTime.slice(0, 5) : ''}`
      : 'See event page',
    priceRange: priceRange(minPrice),
  }
}

export async function fetchTicketmasterEvents(
  lat: number,
  lng: number,
  radius = 10,
  keyword?: string
): Promise<Activity[]> {
  if (!API_KEY) return []

  const params = new URLSearchParams({
    apikey: API_KEY,
    latlong: `${lat},${lng}`,
    radius: String(radius),
    unit: 'miles',
    size: '20',
    sort: 'relevance,desc',
  })

  if (keyword) params.set('keyword', keyword)

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
    )
    if (!res.ok) throw new Error(`Ticketmaster ${res.status}`)
    const data = await res.json()
    const events = data._embedded?.events ?? []
    return events.map(transformEvent)
  } catch (err) {
    console.warn('[Ticketmaster] fetch failed:', err)
    return []
  }
}
