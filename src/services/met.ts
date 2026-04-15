import type { Activity } from '../types'

const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformObject(obj: any): Activity {
  const artistInfo = obj.artistDisplayName ? `By ${obj.artistDisplayName}` : ''
  const dateInfo = obj.objectDate ? `(${obj.objectDate})` : ''
  const mediumInfo = obj.medium ? `Medium: ${obj.medium}.` : ''
  const deptInfo = obj.department ? `${obj.department} collection` : 'permanent collection'

  return {
    id: `met_${obj.objectID}`,
    name: obj.title || 'Metropolitan Museum of Art Exhibit',
    category: 'arts',
    description: [artistInfo, dateInfo, mediumInfo, `Part of The Met's ${deptInfo}.`]
      .filter(Boolean)
      .join(' '),
    lat: 40.7794,
    lng: -73.9632,
    address: '1000 5th Ave, New York, NY 10028',
    rating: 4.8,
    reviewCount: 75000,
    reviews: [],
    tags: [
      'museum',
      'art',
      'the met',
      'metropolitan museum',
      obj.department?.toLowerCase(),
      obj.objectName?.toLowerCase(),
    ].filter((t): t is string => !!t),
    hours: 'Sun–Tue & Thu 10am–5pm, Fri–Sat 10am–9pm, Wed Closed',
    priceRange: '$$',
    image: obj.primaryImageSmall || obj.primaryImage || undefined,
  }
}

export async function fetchMETHighlights(query?: string): Promise<Activity[]> {
  try {
    const searchTerm = query?.trim() || 'impressionism'
    const searchRes = await fetch(
      `${BASE}/search?q=${encodeURIComponent(searchTerm)}&hasImages=true&isHighlight=true`
    )
    if (!searchRes.ok) throw new Error(`MET search ${searchRes.status}`)
    const { objectIDs } = await searchRes.json()

    if (!objectIDs?.length) return []

    // Fetch up to 5 highlighted objects in parallel
    const ids: number[] = objectIDs.slice(0, 5)
    const objects = await Promise.all(
      ids.map((id: number) =>
        fetch(`${BASE}/objects/${id}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    )

    return objects
      .filter((obj): obj is any => obj !== null && !!obj.objectID && !!obj.title)
      .map(transformObject)
  } catch (err) {
    console.warn('[MET] fetch failed:', err)
    return []
  }
}
