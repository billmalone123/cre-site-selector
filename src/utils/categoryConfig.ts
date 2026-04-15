import type { Category } from '../types'

export const categoryConfig: Record<
  Category,
  { label: string; color: string; bg: string; emoji: string; markerColor: string }
> = {
  food: {
    label: 'Food & Drink',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    emoji: '🍽️',
    markerColor: '#ea580c',
  },
  outdoors: {
    label: 'Outdoors',
    color: 'text-green-600',
    bg: 'bg-green-100',
    emoji: '🌿',
    markerColor: '#16a34a',
  },
  entertainment: {
    label: 'Entertainment',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    emoji: '🎭',
    markerColor: '#9333ea',
  },
  arts: {
    label: 'Arts & Culture',
    color: 'text-pink-600',
    bg: 'bg-pink-100',
    emoji: '🎨',
    markerColor: '#db2777',
  },
  nightlife: {
    label: 'Nightlife',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    emoji: '🌙',
    markerColor: '#4338ca',
  },
  sports: {
    label: 'Sports',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    emoji: '⚡',
    markerColor: '#2563eb',
  },
}
