import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StarRating } from "./StarRating";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  overallRating: number;
  reviews: Review[];
}

export function ReviewsViewer({ 
  isOpen, 
  onClose, 
  sellerName, 
  overallRating,
  reviews 
}: ReviewsViewerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 bg-white z-[110] flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg text-black">Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={overallRating} size={12} />
                  <span className="text-sm text-gray-500">
                    {overallRating.toFixed(1)} · {reviews.length} reviews
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 -mr-2">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Reviews List */}
          <div className="flex-1 overflow-y-auto">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
                <p className="text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <ImageWithFallback
                        src={review.reviewerAvatar}
                        alt={review.reviewerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-black font-medium">
                            {review.reviewerName}
                          </p>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={review.rating} size={11} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mock reviews generator for demo purposes
export function generateMockReviews(sellerName: string): Review[] {
  const comments = [
    "Great seller! Item was exactly as described and in perfect condition.",
    "Very responsive and easy to work with. Would buy again!",
    "Item arrived on time and was well-packaged. Highly recommend!",
    "Smooth transaction, no issues at all. Thanks!",
    "Product was as advertised. Quick and easy pickup.",
    "Excellent communication throughout the process.",
    "Item was better than expected! Very happy with my purchase.",
    "Fast replies and fair pricing. Will buy from again.",
  ];

  const names = [
    "Sarah Johnson",
    "Michael Chen",
    "Emily Rodriguez",
    "David Thompson",
    "Jessica Lee",
    "Ryan Martinez",
    "Amanda Wilson",
    "Chris Anderson",
  ];

  const avatarSeeds = [1, 2, 3, 4, 5, 6, 7, 8];

  return Array.from({ length: 6 }, (_, i) => ({
    id: `review-${i}`,
    reviewerName: names[i % names.length],
    reviewerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeeds[i % avatarSeeds.length]}`,
    rating: Math.random() > 0.3 ? 5 : Math.random() > 0.5 ? 4 : 3,
    comment: comments[i % comments.length],
    date: `${Math.floor(Math.random() * 30) + 1}d ago`,
  }));
}
