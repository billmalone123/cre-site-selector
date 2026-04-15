import { useState } from 'react'
import { X, MapPin, Clock, ThumbsUp, Star } from 'lucide-react'
import type { Activity, Review } from '../types'
import { categoryConfig } from '../utils/categoryConfig'
import { StarRating } from './StarRating'

interface Props {
  activity: Activity
  onClose: () => void
  onAddReview: (activityId: string, review: Omit<Review, 'id' | 'helpful'>) => void
}

export function ActivityPanel({ activity, onClose, onAddReview }: Props) {
  const config = categoryConfig[activity.category]
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ author: '', rating: 5, text: '' })

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!newReview.author.trim() || !newReview.text.trim()) return
    onAddReview(activity.id, { ...newReview, date: new Date().toISOString().split('T')[0] })
    setNewReview({ author: '', rating: 5, text: '' })
    setShowReviewForm(false)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="relative">
        <div className={`h-2 w-full ${config.bg} opacity-80`} style={{ backgroundColor: config.markerColor }} />
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  {config.emoji} {config.label}
                </span>
                <span className="text-xs font-medium text-gray-500">{activity.priceRange}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{activity.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating rating={activity.rating} size="sm" />
                <span className="text-sm font-semibold text-gray-800">{activity.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({activity.reviewCount.toLocaleString()} reviews)</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4 space-y-4">
          {/* Info row */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              {activity.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              {activity.hours}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-700 text-sm leading-relaxed">{activity.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {activity.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Reviews header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              Reviews
            </h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              {showReviewForm ? 'Cancel' : '+ Add yours'}
            </button>
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={newReview.author}
                onChange={(e) => setNewReview((r) => ({ ...r, author: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <div>
                <p className="text-xs text-gray-500 mb-1">Your rating</p>
                <StarRating
                  rating={newReview.rating}
                  size="lg"
                  interactive
                  onChange={(r) => setNewReview((prev) => ({ ...prev, rating: r }))}
                />
              </div>
              <textarea
                placeholder="Share your experience..."
                value={newReview.text}
                onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
              >
                Post Review
              </button>
            </form>
          )}

          {/* Reviews list */}
          <div className="space-y-3">
            {activity.reviews.map((review) => (
              <div key={review.id} className="border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-semibold text-sm text-gray-900">{review.author}</span>
                    <span className="text-xs text-gray-400 ml-2">{review.date}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                <button className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <ThumbsUp size={12} />
                  Helpful ({review.helpful})
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
