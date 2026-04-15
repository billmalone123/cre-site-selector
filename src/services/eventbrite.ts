import type { Activity } from '../types'

const API_KEY = import.meta.env.VITE_EVENTBRITE_API_KEY as string | undefined

const FORMAT_TO_CATEGORY: Record<string, Activity['category']> = {
  conference: 'entertainment',
  seminar: 'entertainment',
  expo: 'entertainment',
  convention: 'entertainment',
  festival: 'entertainment',
  performance: 'arts',
  concert: 'entertainment',
  screening: 'arts',
  gala: 'nightlife',
  game: 'sports',
  race: 'sports',
  tour: 'outdoors',
  attraction: 'outdoors',
  retreat: 'outdoors',
  class: 'arts',
  networking: 'entertainment',
  party: 'nightlife',
  community: 'entertainment',
  other: 'entertainment',
}

function mapFormat(formatName?: string): Activity['category'] {
  if (!formatName) return 'entertainment'
  const key = formatName.toLowerCase()
  return FORMAT_TO_CATEGORY[key] ?? 'entertainment'
}

function parsePrice(event: {
  is_free?: boolean
  ticket_availability?: { minimum_ticket_price?: { major_value?: string } }
}): Activity['priceRange'] {
  if (event.is_free) return 'Free'
  const min = parseFloat(
    event.ticket_availability?.minimum_ticket_price?.major_value ?? '0'
  )
  if (min === 0) return 'Free'
  if (min < 20) return '$'
  if (min < 60) return '$$'
  return '$$$'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEvent(event: any): Activity {
  const venue = event.venue
  return {
    id: `eb_${event.id}`,
    name: event.name?.text ?? 'Untitled Event',
    category: mapFormat(event.format?.short_name),
    description:
      event.description?.text?.slice(0, 300) ??
      event.summary ??
      `Join us for ${event.name?.text} — a ${event.format?.short_name ?? 'local'} event near you.`,
    lat: parseFloat(venue?.latitude ?? '40.7589'),
    lng: parseFloat(venue?.longitude ?? '-73.9851'),
    address: venue
      ? [venue.address?.address_1, venue.address?.city, venue.address?.region]
          .filter(Boolean)
          .join(', ')
      : 'Online or TBD',
    rating: 4.0 + Math.random() * 0.9,
    reviewCount: Math.floor(Math.random() * 150 + 10),
    reviews: [],
    tags: [
      event.format?.short_name?.toLowerCase(),
      event.category?.short_name?.toLowerCase(),
      'eventbrite',
      event.is_free ? 'free' : 'ticketed',
    ].filter(Boolean),
    hours: event.start?.local
      ? new Date(event.start.local).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'See event page',
    priceRange: parsePrice(event),
  }
}

export async function fetchEventbriteEvents(
  lat: number,
  lng: number,
  query?: string
): Promise<Activity[]> {
  if (!API_KEY) return []

  const params = new URLSearchParams({
    'location.latitude': String(lat),
    'location.longitude': String(lng),
    'location.within': '10mi',
    expand: 'venue,format,category,ticket_availability',
    'page_size': '20',
    sort_by: 'date',
  })
  if (query) params.set('q', query)

  try {
    const res = await fetch(`/eventbrite-api/v3/events/search/?${params}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (!res.ok) throw new Error(`Eventbrite ${res.status}`)
    const data = await res.json()
    return (data.events ?? []).map(transformEvent)
  } catch (err) {
    console.warn('[Eventbrite] fetch failed:', err)
    return []
  }
}
