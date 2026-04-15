import { useState, useEffect, useRef } from 'react'
import type { Activity } from '../types'
import { fetchTicketmasterEvents } from '../services/ticketmaster'
import { fetchFoursquarePlaces } from '../services/foursquare'
import { fetchYelpBusinesses } from '../services/yelp'
import { fetchEventbriteEvents } from '../services/eventbrite'
import { fetchSeatGeekEvents } from '../services/seatgeek'
import { fetchNYCEvents } from '../services/nycevents'
import { fetchMETHighlights } from '../services/met'
import { fetchOverpassPOIs } from '../services/overpass'
import { fetchNYCParksActivities } from '../services/nycparks'
import { fetchCitiBikeStations } from '../services/citibike'
import { mockActivities } from '../data/mockActivities'

const HAS_TICKETMASTER = !!import.meta.env.VITE_TICKETMASTER_API_KEY
const HAS_FOURSQUARE  = false // Foursquare v3 access cut off for accounts created after June 2025
const HAS_YELP        = !!import.meta.env.VITE_YELP_API_KEY
const HAS_EVENTBRITE  = false // Eventbrite restricted public event search API in 2023
const HAS_SEATGEEK    = !!import.meta.env.VITE_SEATGEEK_CLIENT_ID
const HAS_NYC_EVENTS  = true  // No key required
const HAS_MET         = true  // No key required — public API
const HAS_OVERPASS    = true  // No key required — OpenStreetMap
const HAS_NYC_PARKS   = true  // No key required — NYC Open Data
const HAS_CITIBIKE    = true  // No key required — GBFS feed

const ANY_KEY = HAS_TICKETMASTER || HAS_FOURSQUARE || HAS_YELP || HAS_EVENTBRITE || HAS_SEATGEEK || HAS_NYC_EVENTS || HAS_MET || HAS_OVERPASS || HAS_NYC_PARKS || HAS_CITIBIKE

interface Options {
  lat: number
  lng: number
  query?: string
  enabled: boolean
}

export interface DataStatus {
  source: 'mock' | 'live'
  loading: boolean
  providers: string[]
}

export function useRealActivities({ lat, lng, query, enabled }: Options) {
  const [activities, setActivities] = useState<Activity[]>(mockActivities)
  const [status, setStatus] = useState<DataStatus>({
    source: 'mock',
    loading: false,
    providers: [],
  })
  const fetchedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !ANY_KEY) return

    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${query ?? ''}`
    if (fetchedKey.current === key) return
    fetchedKey.current = key

    setStatus((s) => ({ ...s, loading: true }))

    const activeProviders: string[] = []

    Promise.all([
      HAS_TICKETMASTER
        ? fetchTicketmasterEvents(lat, lng, 10).then((r) => { if (r.length) activeProviders.push('Ticketmaster'); return r })
        : Promise.resolve([]),
      HAS_FOURSQUARE
        ? fetchFoursquarePlaces(lat, lng, query).then((r) => { if (r.length) activeProviders.push('Foursquare'); return r })
        : Promise.resolve([]),
      HAS_YELP
        ? fetchYelpBusinesses(lat, lng, query).then((r) => { if (r.length) activeProviders.push('Yelp'); return r })
        : Promise.resolve([]),
      HAS_EVENTBRITE
        ? fetchEventbriteEvents(lat, lng, query).then((r) => { if (r.length) activeProviders.push('Eventbrite'); return r })
        : Promise.resolve([]),
      HAS_SEATGEEK
        ? fetchSeatGeekEvents(lat, lng).then((r) => { if (r.length) activeProviders.push('SeatGeek'); return r })
        : Promise.resolve([]),
      HAS_NYC_EVENTS
        ? fetchNYCEvents().then((r) => { if (r.length) activeProviders.push('NYC Events'); return r })
        : Promise.resolve([]),
      HAS_MET
        ? fetchMETHighlights(query).then((r) => { if (r.length) activeProviders.push('The Met'); return r })
        : Promise.resolve([]),
      HAS_OVERPASS
        ? fetchOverpassPOIs(lat, lng, query).then((r) => { if (r.length) activeProviders.push('OpenStreetMap'); return r })
        : Promise.resolve([]),
      HAS_NYC_PARKS
        ? fetchNYCParksActivities().then((r) => { if (r.length) activeProviders.push('NYC Parks'); return r })
        : Promise.resolve([]),
      HAS_CITIBIKE
        ? fetchCitiBikeStations(lat, lng).then((r) => { if (r.length) activeProviders.push('Citi Bike'); return r })
        : Promise.resolve([]),
    ]).then((results) => {
      const all = results.flat()

      if (all.length > 0) {
        const seen = new Set<string>()
        const unique = all.filter((a) => {
          if (seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })
        setActivities(unique)
        setStatus({ source: 'live', loading: false, providers: activeProviders })
      } else {
        setStatus({ source: 'mock', loading: false, providers: [] })
      }
    }).catch(() => {
      setStatus({ source: 'mock', loading: false, providers: [] })
    })
  }, [enabled, lat, lng, query])

  return { activities, ...status }
}
