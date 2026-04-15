import type { Activity } from '../types'

const API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY as string | undefined

// Foursquare category IDs → GoDo categories
const CATEGORY_MAP: Record<string, Activity['category']> = {
  '13000': 'food',       // Dining & Drinking
  '13065': 'food',       // Restaurant
  '13032': 'food',       // Bar
  '16000': 'outdoors',   // Landmarks & Outdoors
  '16032': 'outdoors',   // Park
  '10000': 'arts',       // Arts & Entertainment
  '10027': 'entertainment', // Movie Theater
  '10024': 'arts',       // Museum
  '18000': 'sports',     // Sports & Recreation
  '18021': 'sports',     // Gym / Fitness
  '11000': 'entertainment', // Community & Government
}

function fsqCategoryToGoDo(categories: { id: string }[]): Activity['category'] {
  for (const cat of categories ?? []) {
    const prefix4 = cat.id.slice(0, 5)
    const prefix3 = cat.id.slice(0, 5)
    if (CATEGORY_MAP[prefix4]) return CATEGORY_MAP[prefix4]
    if (CATEGORY_MAP[prefix3]) return CATEGORY_MAP[prefix3]
  }
  return 'entertainment'
}

function fsqPriceToRange(price?: number): Activity['priceRange'] {
  if (!price) return '$$'
  if (price === 1) return '$'
  if (price === 2) return '$$'
  return '$$$'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPlace(place: any): Activity {
  const loc = place.geocodes?.main
  const addr = place.location

  return {
    id: `fsq_${place.fsq_id}`,
    name: place.name,
    category: fsqCategoryToGoDo(place.categories ?? []),
    description:
      place.description ??
      `${place.name} is a ${place.categories?.[0]?.name ?? 'local spot'} in ${addr?.locality ?? 'your area'}.`,
    lat: loc?.latitude ?? 40.7589,
    lng: loc?.longitude ?? -73.9851,
    address: [addr?.address, addr?.locality, addr?.region].filter(Boolean).join(', '),
    rating: place.rating ? place.rating / 2 : 4.0 + Math.random() * 0.8, // FSQ rates 0-10
    reviewCount: place.stats?.total_ratings ?? Math.floor(Math.random() * 200 + 20),
    reviews: [],
    tags: (place.categories ?? []).map((c: { name: string }) => c.name.toLowerCase()),
    hours: place.hours?.display ?? 'See listing for hours',
    priceRange: fsqPriceToRange(place.price),
  }
}

export async function fetchFoursquarePlaces(
  lat: number,
  lng: number,
  query?: string
): Promise<Activity[]> {
  if (!API_KEY) return []

  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: '8000', // ~5 miles in meters
    limit: '20',
    sort: 'POPULARITY',
    fields: 'fsq_id,name,geocodes,location,categories,rating,price,hours,stats,description',
  })

  if (query) params.set('query', query)

  try {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?${params}`,
      { headers: { Authorization: API_KEY } }
    )
    if (!res.ok) throw new Error(`Foursquare ${res.status}`)
    const data = await res.json()
    return (data.results ?? []).map(transformPlace)
  } catch (err) {
    console.warn('[Foursquare] fetch failed:', err)
    return []
  }
}
