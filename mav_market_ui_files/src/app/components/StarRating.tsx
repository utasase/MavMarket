import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = rating >= star - 0.5 && rating < star;
        return (
          <Star
            key={star}
            size={size}
            className={
              filled
                ? "text-yellow-400 fill-yellow-400"
                : half
                ? "text-yellow-400 fill-yellow-400/50"
                : "text-gray-200 fill-gray-200"
            }
          />
        );
      })}
      {showValue && (
        <span className="text-xs text-gray-400 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
