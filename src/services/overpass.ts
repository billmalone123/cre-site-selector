import type { Activity, Category } from '../types'

const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToCategory(tags: Record<string, string>): Category {
  const amenity = tags.amenity || ''
  const leisure = tags.leisure || ''
  const tourism = tags.tourism || ''

  if (['restaurant', 'cafe', 'fast_food', 'food_court', 'bakery', 'ice_cream'].includes(amenity)) return 'food'
  if (['bar', 'pub', 'nightclub', 'biergarten', 'cocktail'].includes(amenity)) return 'nightlife'
  if (['cinema', 'theatre', 'music_venue', 'events_venue'].includes(amenity)) return 'entertainment'
  if (['museum', 'gallery', 'arts_centre', 'library'].includes(amenity) || ['museum', 'gallery', 'artwork'].includes(tourism)) return 'arts'
  if (['gym', 'fitness_centre', 'sports_centre', 'swimming_pool'].includes(amenity) || ['sports_centre', 'swimming_pool', 'pitch', 'track', 'fitness_station', 'fitness_centre'].includes(leisure)) return 'sports'
  if (['park', 'garden', 'nature_reserve', 'playground', 'dog_park'].includes(leisure)) return 'outdoors'
  if (tourism === 'attraction') return 'entertainment'
  return 'entertainment'
}

function mapPriceRange(tags: Record<string, string>): Activity['priceRange'] {
  const fee = tags.fee || ''
  if (fee === 'no' || fee === 'free') return 'Free'
  if (tags.amenity === 'park' || tags.leisure === 'park') return 'Free'
  return '$'
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
  ].filter(Boolean)
  return parts.length ? `${parts.join(' ')}, New York, NY` : 'New York, NY'
}

function buildTags(tags: Record<string, string>): string[] {
  const result: string[] = []
  if (tags.amenity) result.push(tags.amenity.replace(/_/g, ' '))
  if (tags.cuisine) result.push(...tags.cuisine.split(';').map(c => c.trim()))
  if (tags.leisure) result.push(tags.leisure.replace(/_/g, ' '))
  if (tags.tourism) result.push(tags.tourism)
  if (tags.sport) result.push(...tags.sport.split(';').map(s => s.trim()))
  return result.filter(Boolean).map(t => t.toLowerCase())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformElement(el: any): Activity | null {
  const tags: Record<string, string> = el.tags || {}
  const name = tags.name
  if (!name) return null

  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (!lat || !lng) return null

  return {
    id: `osm_${el.type}_${el.id}`,
    name,
    category: mapToCategory(tags),
    description: tags.description || tags['note'] || `${name} in New York City.`,
    lat,
    lng,
    address: buildAddress(tags),
    rating: parseFloat((4.0 + Math.random() * 0.8).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 500 + 10),
    reviews: [],
    tags: buildTags(tags),
    hours: tags['opening_hours'] || 'See listing for hours',
    priceRange: mapPriceRange(tags),
  }
}

export async function fetchOverpassPOIs(lat: number, lng: number, query?: string): Promise<Activity[]> {
  try {
    const radius = 2000 // 2km

    const overpassQuery = `
[out:json][timeout:20];
(
  node["amenity"~"restaurant|cafe|bar|pub|nightclub|cinema|theatre|museum|gym|fast_food|ice_cream|arts_centre"](around:${radius},${lat},${lng});
  node["leisure"~"park|sports_centre|swimming_pool|fitness_centre|fitness_station|playground"](around:${radius},${lat},${lng});
  node["tourism"~"museum|gallery|attraction|artwork"](around:${radius},${lat},${lng});
  way["leisure"~"park|sports_centre|swimming_pool|pitch|garden|playground|nature_reserve"](around:${radius},${lat},${lng});
  way["tourism"~"museum|gallery|attraction"](around:${radius},${lat},${lng});
);
out center 50;
    `.trim()

    const res = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!res.ok) throw new Error(`Overpass API ${res.status}`)
    const data = await res.json()

    const activities = (data.elements || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((el: any) => transformElement(el))
      .filter((a): a is Activity => a !== null)
      .filter((a: Activity) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          a.tags.some(t => t.includes(q)) ||
          a.category.includes(q)
        )
      })

    // Deduplicate by name
    const seen = new Set<string>()
    return activities.filter((a: Activity) => {
      if (seen.has(a.name)) return false
      seen.add(a.name)
      return true
    })
  } catch (err) {
    console.warn('[Overpass] fetch failed:', err)
    return []
  }
}
