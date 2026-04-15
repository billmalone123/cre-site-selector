import type { Activity } from '../types'

const API_KEY = import.meta.env.VITE_YELP_API_KEY as string | undefined

const YELP_TO_GODO: Record<string, Activity['category']> = {
  restaurants: 'food',
  food: 'food',
  bars: 'nightlife',
  nightlife: 'nightlife',
  arts: 'arts',
  active: 'outdoors',
  parks: 'outdoors',
  fitness: 'sports',
  sports: 'sports',
  entertainment: 'entertainment',
  movietheaters: 'entertainment',
  museums: 'arts',
  galleries: 'arts',
}

function mapYelpCategory(aliases: { alias: string }[]): Activity['category'] {
  for (const { alias } of aliases ?? []) {
    const key = Object.keys(YELP_TO_GODO).find((k) => alias.includes(k))
    if (key) return YELP_TO_GODO[key]
  }
  return 'entertainment'
}

function mapPrice(price?: string): Activity['priceRange'] {
  if (!price) return '$$'
  if (price === '$') return '$'
  if (price === '$$') return '$$'
  return '$$$'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformBusiness(b: any): Activity {
  return {
    id: `yelp_${b.id}`,
    name: b.name,
    category: mapYelpCategory(b.categories ?? []),
    description:
      `${b.name} — ${b.categories?.map((c: { title: string }) => c.title).join(', ')}. ` +
      `Located at ${b.location?.address1 ?? 'local area'}. ` +
      (b.is_closed ? 'Currently closed.' : 'Currently open.'),
    lat: b.coordinates?.latitude ?? 40.7589,
    lng: b.coordinates?.longitude ?? -73.9851,
    address: [b.location?.address1, b.location?.city, b.location?.state]
      .filter(Boolean)
      .join(', '),
    rating: b.rating ?? 4.0,
    reviewCount: b.review_count ?? 0,
    reviews: [],
    tags: (b.categories ?? []).map((c: { alias: string }) => c.alias),
    hours: b.hours?.[0]?.is_open_now ? 'Open now' : 'See listing for hours',
    priceRange: mapPrice(b.price),
  }
}

export async function fetchYelpBusinesses(
  lat: number,
  lng: number,
  term?: string
): Promise<Activity[]> {
  if (!API_KEY) return []

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: '8000',
    limit: '20',
    sort_by: 'rating',
  })
  if (term) params.set('term', term)

  try {
    const res = await fetch(`/yelp-api/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (!res.ok) throw new Error(`Yelp ${res.status}`)
    const data = await res.json()
    return (data.businesses ?? []).map(transformBusiness)
  } catch (err) {
    console.warn('[Yelp] fetch failed:', err)
    return []
  }
}
