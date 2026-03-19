import { useState } from "react";
import { X, Heart, RotateCcw, ShoppingBag } from "lucide-react";
import { listings, type ListingItem } from "../data/mockData";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, useMotionValue, useTransform, type PanInfo, AnimatePresence } from "motion/react";
import { ItemDetail } from "./ItemDetail";

export function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  const availableItems = listings.filter(
    (item) => !liked.includes(item.id) && !passed.includes(item.id)
  );

  const currentItem = availableItems[0];
  const nextItem = availableItems[1];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentItem) return;
    setExitDirection(direction);

    setTimeout(() => {
      if (direction === "right") {
        setLiked((prev) => [...prev, currentItem.id]);
      } else {
        setPassed((prev) => [...prev, currentItem.id]);
      }
      setExitDirection(null);
    }, 300);
  };

  const handleUndo = () => {
    if (passed.length > 0) {
      setPassed((prev) => prev.slice(0, -1));
    } else if (liked.length > 0) {
      setLiked((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setLiked([]);
    setPassed([]);
    setExitDirection(null);
    setShowResults(false);
  };

  const toggleSave = (id: string) => {
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (showResults || (!currentItem && (liked.length > 0 || passed.length > 0))) {
    const likedItems = listings.filter((item) => liked.includes(item.id));
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-lg text-black">Your Picks</h1>
            <span className="text-xs text-gray-400">
              {likedItems.length} items
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {likedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Heart size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No liked items yet</p>
            </div>
          ) : (
            likedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-black truncate">{item.title}</h3>
                  <p className="text-sm text-gray-900">${item.price}</p>
                  <p className="text-[11px] text-gray-400">{item.sellerName}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4">
          <button
            onClick={handleReset}
            className="w-full bg-black text-white py-3 rounded-lg text-sm"
          >
            Start Over
          </button>
        </div>

        {/* Animated Item Detail Overlay */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-50"
            >
              <ItemDetail
                item={selectedItem}
                onBack={() => setSelectedItem(null)}
                isSaved={savedItems.includes(selectedItem.id)}
                onToggleSave={() => toggleSave(selectedItem.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-14 pb-2 flex items-center justify-between">
        <h1 className="text-lg text-black">Discover</h1>
        <button
          onClick={() => setShowResults(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500"
        >
          <Heart size={16} strokeWidth={1.5} />
          <span>{liked.length}</span>
        </button>
      </div>

      {/* Swipe Area */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {!currentItem ? (
          <div className="text-center text-gray-400">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No more items</p>
            <button
              onClick={handleReset}
              className="mt-3 bg-black text-white px-6 py-2 rounded-lg text-sm"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-[3/4]">
            {/* Next card preview */}
            {nextItem && (
              <div className="absolute inset-0 scale-[0.95] rounded-2xl overflow-hidden opacity-40">
                <ImageWithFallback
                  src={nextItem.image}
                  alt={nextItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Current card */}
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipe={handleSwipe}
              exitDirection={exitDirection}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentItem && (
        <div className="flex justify-center items-center gap-5 pb-5 pt-3">
          <button
            onClick={handleUndo}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-gray-200 text-gray-400"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => handleSwipe("left")}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors"
          >
            <X size={26} />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors"
          >
            <Heart size={26} />
          </button>
          <button
            onClick={() => setShowResults(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-gray-200 text-gray-400"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  item,
  onSwipe,
  exitDirection,
}: {
  item: ListingItem;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection: "left" | "right" | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={
        exitDirection === "left"
          ? { x: -400, opacity: 0, rotate: -20 }
          : exitDirection === "right"
          ? { x: 400, opacity: 0, rotate: 20 }
          : { x: 0, opacity: 1 }
      }
      transition={{ duration: 0.3 }}
    >
      <ImageWithFallback
        src={item.image}
        alt={item.title}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* Overlays */}
      <motion.div
        className="absolute top-8 left-6 border-2 border-green-400 text-green-400 px-4 py-2 rounded-lg rotate-[-12deg]"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-lg">WANT</span>
      </motion.div>
      <motion.div
        className="absolute top-8 right-6 border-2 border-red-400 text-red-400 px-4 py-2 rounded-lg rotate-[12deg]"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-lg">PASS</span>
      </motion.div>

      {/* Item info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-24">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-white text-lg">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <ImageWithFallback
                src={item.sellerAvatar}
                alt={item.sellerName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-white/70 text-xs">{item.sellerName}</span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg">
            <span className="text-lg">${item.price}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}