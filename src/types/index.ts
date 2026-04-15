export type Category =
  | 'food'
  | 'outdoors'
  | 'entertainment'
  | 'arts'
  | 'nightlife'
  | 'sports'

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
  helpful: number
}

export interface Activity {
  id: string
  name: string
  category: Category
  description: string
  lat: number
  lng: number
  address: string
  rating: number
  reviewCount: number
  reviews: Review[]
  tags: string[]
  hours: string
  priceRange: '$' | '$$' | '$$$' | 'Free'
  image?: string
}

export type FilterState = {
  search: string
  categories: Category[]
  minRating: number
}
