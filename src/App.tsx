import { useState, useMemo, useCallback } from 'react'
import { Navigation, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff } from 'lucide-react'
import { MapView } from './components/MapView'
import { Sidebar } from './components/Sidebar'
import { ActivityPanel } from './components/ActivityPanel'
import { LandingPage } from './components/LandingPage'
import { LoadingScreen } from './components/LoadingScreen'
import { useRealActivities } from './hooks/useRealActivities'
import type { Activity, FilterState, Review } from './types'

type Screen = 'landing' | 'loading' | 'map'

const ALL_CATEGORIES = ['food', 'outdoors', 'entertainment', 'arts', 'nightlife', 'sports'] as const

// Default map center: NYC. Will be replaced by user location if granted.
const DEFAULT_CENTER: [number, number] = [40.7589, -73.9851]

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [searchQuery, setSearchQuery] = useState('')
  const [userReviews, setUserReviews] = useState<Record<string, Review[]>>({})
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [...ALL_CATEGORIES],
    minRating: 0,
  })
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)

  const mapCenter = userLocation ?? DEFAULT_CENTER

  const { activities: baseActivities, source, providers, loading: dataLoading } = useRealActivities({
    lat: mapCenter[0],
    lng: mapCenter[1],
    query: searchQuery || undefined,
    enabled: screen === 'map',
  })

  // Merge user-submitted reviews into activities
  const activities = useMemo(() =>
    baseActivities.map((a) => ({
      ...a,
      reviews: [...(userReviews[a.id] ?? []), ...a.reviews],
      reviewCount: a.reviewCount + (userReviews[a.id]?.length ?? 0),
    })),
    [baseActivities, userReviews]
  )

  function handleSearch(query: string) {
    setSearchQuery(query)
    setFilters((f) => ({ ...f, search: '' })) // landing query drives API, not the display filter
    setScreen('loading')
  }

  function handleLoadingDone() {
    setScreen('map')
  }

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (!filters.categories.includes(a.category)) return false
      if (a.rating < filters.minRating) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.description.toLowerCase().includes(q) &&
          !a.tags.some((t) => t.includes(q))
        )
          return false
      }
      return true
    })
  }, [activities, filters])

  function handleSelectActivity(activity: Activity) {
    setSelectedActivity(activity)
    setDetailOpen(true)
  }

  function handleCloseDetail() {
    setDetailOpen(false)
    setTimeout(() => setSelectedActivity(null), 300)
  }

  const handleAddReview = useCallback(
    (activityId: string, review: Omit<Review, 'id' | 'helpful'>) => {
      const newReview: Review = { ...review, id: `r${Date.now()}`, helpful: 0 }
      setUserReviews((prev) => ({
        ...prev,
        [activityId]: [newReview, ...(prev[activityId] ?? [])],
      }))
    },
    []
  )

  function handleLocateMe() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => alert('Location access denied. Please enable location in your browser.')
    )
  }

  // --- Landing ---
  if (screen === 'landing') {
    return <LandingPage onSearch={handleSearch} />
  }

  // --- Loading ---
  if (screen === 'loading') {
    return <LoadingScreen query={searchQuery} onDone={handleLoadingDone} />
  }

  // --- Map ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-72 h-full">
          <Sidebar
            activities={filteredActivities}
            filters={filters}
            onFilterChange={setFilters}
            onSelectActivity={handleSelectActivity}
            selectedId={selectedActivity?.id ?? null}
          />
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <MapView
          activities={filteredActivities}
          selectedActivity={selectedActivity}
          onSelectActivity={handleSelectActivity}
          userLocation={userLocation}
        />

        {/* Floating controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-[1000]">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="bg-white shadow-lg rounded-xl p-2.5 text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button
            onClick={handleLocateMe}
            className="bg-white shadow-lg rounded-xl p-2.5 text-gray-600 hover:text-green-600 hover:shadow-xl transition-all"
            aria-label="Find my location"
          >
            <Navigation size={18} />
          </button>
          <button
            onClick={() => { setScreen('landing'); setDetailOpen(false); setSelectedActivity(null) }}
            className="bg-white shadow-lg rounded-xl px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all text-sm font-semibold"
          >
            GoDo
          </button>
        </div>

        {/* Live / Mock data badge */}
        <div className="absolute top-4 right-4 z-[1000]">
          {dataLoading ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md bg-white text-gray-500 animate-pulse">
              <Wifi size={12} /> Fetching live data...
            </div>
          ) : source === 'live' ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md bg-green-500 text-white">
                <Wifi size={12} /> Live data
              </div>
              {providers.length > 0 && (
                <div className="flex gap-1 flex-wrap justify-end">
                  {providers.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full text-xs bg-white/90 text-gray-600 shadow-sm font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md bg-white text-gray-500">
              <WifiOff size={12} /> Demo data
            </div>
          )}
        </div>

        {!detailOpen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 text-sm text-gray-600 pointer-events-none">
              Tap a pin to discover what's here
            </div>
          </div>
        )}
      </div>

      {/* Activity detail panel */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          detailOpen ? 'w-80' : 'w-0'
        } overflow-hidden border-l border-gray-100 shadow-xl`}
      >
        <div className="w-80 h-full">
          {selectedActivity && (
            <ActivityPanel
              activity={selectedActivity}
              onClose={handleCloseDetail}
              onAddReview={handleAddReview}
            />
          )}
        </div>
      </div>
    </div>
  )
}
