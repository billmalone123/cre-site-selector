interface Props {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({ rating, size = 'md', interactive = false, onChange }: Props) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }

  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="cursor-pointer hover:scale-110 transition-transform"
            aria-label={`${star} star`}
          >
            <span className={star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
          </button>
        ) : (
          <span key={star} aria-label={`${star} star`} className="cursor-default">
            <span className={star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
          </span>
        )
      )}
    </div>
  )
}
