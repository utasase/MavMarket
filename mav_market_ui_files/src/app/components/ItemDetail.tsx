import { useState } from "react";
import { ChevronLeft, Heart } from "lucide-react";
import { type ListingItem } from "../data/mockData";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import { PickupMap } from "./PickupMap";
import { ReviewsViewer, generateMockReviews } from "./ReviewsViewer";

export function ItemDetail({
  item,
  onBack,
  isSaved,
  onToggleSave,
}: {
  item: ListingItem;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Image */}
      <div className="relative">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full aspect-square object-cover"
        />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onToggleSave}
          className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full"
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            className={isSaved ? "fill-red-500 text-red-500" : ""}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Title & Price */}
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-lg text-black">{item.title}</h2>
            <span className="text-lg text-black">${item.price}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {item.condition}
            </span>
            <span className="text-xs text-gray-400">{item.postedAt}</span>
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100">
          <ImageWithFallback
            src={item.sellerAvatar}
            alt={item.sellerName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-sm text-black">{item.sellerName}</p>
            <button
              onClick={() => setShowReviews(true)}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <StarRating rating={item.sellerRating} size={11} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
        </div>

        {/* Pickup Location */}
        <PickupMap location={item.pickupLocation} />

        {/* Actions */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-4">
          <button className="flex-1 bg-black text-white py-3 rounded-lg text-sm">
            Message Seller
          </button>
          <button
            onClick={onToggleSave}
            className="px-5 border border-gray-200 text-gray-700 py-3 rounded-lg text-sm"
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Reviews Viewer */}
      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        sellerName={item.sellerName}
        overallRating={item.sellerRating}
        reviews={generateMockReviews(item.sellerName)}
      />
    </div>
  );
}