import type { Activity } from '../types'

const GBFS_STATION_INFO = 'https://gbfs.citibikenyc.com/gbfs/en/station_information.json'

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformStation(station: any): Activity {
  const capacity = station.capacity ? `${station.capacity} docks` : 'multiple docks'
  return {
    id: `citibike_${station.station_id}`,
    name: `Citi Bike — ${station.name}`,
    category: 'outdoors',
    description: `Rent a bike and explore NYC! Station at ${station.name} with ${capacity}. Perfect for sightseeing, commuting, or a casual ride through the city.`,
    lat: station.lat,
    lng: station.lon,
    address: station.address || station.name || 'New York, NY',
    rating: 4.5,
    reviewCount: 1200,
    reviews: [],
    tags: ['citi bike', 'bike share', 'cycling', 'outdoor', 'eco-friendly', 'explore nyc'],
    hours: '24/7',
    priceRange: '$',
  }
}

export async function fetchCitiBikeStations(lat: number, lng: number): Promise<Activity[]> {
  try {
    const res = await fetch(GBFS_STATION_INFO)
    if (!res.ok) throw new Error(`Citi Bike API ${res.status}`)
    const data = await res.json()

    const stations: any[] = data?.data?.stations || []

    return stations
      .filter(s => s.lat && s.lon)
      .map(s => ({ ...s, _dist: haversineMeters(lat, lng, s.lat, s.lon) }))
      .filter(s => s._dist <= 800) // within ~0.5 mile
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 5) // nearest 5 stations
      .map(transformStation)
  } catch (err) {
    console.warn('[CitiBike] fetch failed:', err)
    return []
  }
}
