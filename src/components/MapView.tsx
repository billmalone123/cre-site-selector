import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import type { Activity } from '../types'
import { categoryConfig } from '../utils/categoryConfig'
import 'leaflet/dist/leaflet.css'

interface FlyToProps {
  lat: number
  lng: number
}

function FlyTo({ lat, lng }: FlyToProps) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 })
  }, [lat, lng, map])
  return null
}

interface Props {
  activities: Activity[]
  selectedActivity: Activity | null
  onSelectActivity: (activity: Activity) => void
  userLocation: [number, number] | null
}

export function MapView({ activities, selectedActivity, onSelectActivity, userLocation }: Props) {
  const center: [number, number] = userLocation ?? [40.7589, -73.9851]
  const popupRefs = useRef<Record<string, L.CircleMarker | null>>({})

  useEffect(() => {
    if (selectedActivity) {
      const marker = popupRefs.current[selectedActivity.id]
      marker?.openPopup()
    }
  }, [selectedActivity])

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {selectedActivity && (
        <FlyTo lat={selectedActivity.lat} lng={selectedActivity.lng} />
      )}

      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={8}
          pathOptions={{ fillColor: '#3b82f6', fillOpacity: 1, color: 'white', weight: 2 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}

      {activities.map((activity) => {
        const config = categoryConfig[activity.category]
        const isSelected = selectedActivity?.id === activity.id
        return (
          <CircleMarker
            key={activity.id}
            ref={(el) => { popupRefs.current[activity.id] = el }}
            center={[activity.lat, activity.lng]}
            radius={isSelected ? 14 : 10}
            pathOptions={{
              fillColor: config.markerColor,
              fillOpacity: 0.9,
              color: isSelected ? '#fff' : config.markerColor,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{ click: () => onSelectActivity(activity) }}
          >
            <Popup>
              <div className="text-center min-w-[140px]">
                <p className="font-bold text-sm">{activity.name}</p>
                <p className="text-xs text-gray-500">{config.emoji} {config.label}</p>
                <p className="text-xs font-medium text-yellow-500 mt-1">★ {activity.rating.toFixed(1)}</p>
                <button
                  onClick={() => onSelectActivity(activity)}
                  className="mt-2 text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
