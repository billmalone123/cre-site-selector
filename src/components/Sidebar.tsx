import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import type { Activity, Category, FilterState } from '../types'
import { categoryConfig } from '../utils/categoryConfig'
import { StarRating } from './StarRating'

interface Props {
  activities: Activity[]
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onSelectActivity: (activity: Activity) => void
  selectedId: string | null
}

const ALL_CATEGORIES: Category[] = ['food', 'outdoors', 'entertainment', 'arts', 'nightlife', 'sports']

export function Sidebar({ activities, filters, onFilterChange, onSelectActivity, selectedId }: Props) {
  function toggleCategory(cat: Category) {
    const has = filters.categories.includes(cat)
    onFilterChange({
      ...filters,
      categories: has ? filters.categories.filter((c) => c !== cat) : [...filters.categories, cat],
    })
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">GoDo</h1>
            <p className="text-xs text-gray-400 leading-none">Discover what's fun</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <SlidersHorizontal size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const config = categoryConfig[cat]
            const active = filters.categories.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? `${config.bg} ${config.color} ring-1 ring-current`
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-2">
        <span className="text-xs text-gray-400">{activities.length} places found</span>
      </div>

      <hr className="border-gray-100 mx-4" />

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto py-2">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-sm">No activities match your filters</p>
          </div>
        ) : (
          activities.map((activity) => {
            const config = categoryConfig[activity.category]
            const isSelected = selectedId === activity.id
            return (
              <div
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectActivity(activity)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 cursor-pointer ${
                  isSelected ? 'bg-green-50 border-green-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ backgroundColor: config.markerColor + '20' }}
                  >
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{activity.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating rating={activity.rating} size="sm" />
                      <span className="text-xs text-gray-500">{activity.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{activity.priceRange}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{activity.address}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
