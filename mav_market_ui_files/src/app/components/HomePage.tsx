import { useState } from "react";
import { Search, SlidersHorizontal, X, Heart, Menu } from "lucide-react";
import { listings, categories, type ListingItem } from "../data/mockData";
import { MavLogo } from "./MavLogo";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { ItemDetail } from "./ItemDetail";
import { SettingsPanel } from "./SettingsPanel";

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesPrice =
      item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesCondition =
      selectedCondition === "All" || item.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
  });

  const toggleSave = (id: string) => {
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* Main listing view */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-[env(safe-area-inset-top)] pb-2 bg-white">
          <div className="pt-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MavLogo size={28} />
              <h1 className="text-xl text-black tracking-tight">Mav Market</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-black"
              >
                <Search size={22} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 transition-colors ${
                  showFilters ? "text-[#0064B1]" : "text-black"
                }`}
              >
                <SlidersHorizontal size={22} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-black"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Search Bar - toggleable */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none border border-gray-100"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-white border-b border-gray-100"
            >
              <div className="px-4 py-3 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">
                    Max Price: ${priceRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full accent-black"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">
                    Condition
                  </label>
                  <div className="flex gap-2">
                    {["All", "Like New", "Good", "Fair"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCondition(c)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                          selectedCondition === c
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Chips */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-gray-50">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap text-xs px-4 py-1.5 rounded-full transition-all ${
                selectedCategory === cat
                  ? "bg-black text-white"
                  : "bg-transparent text-gray-500 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white text-left relative group cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Save button */}
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 cursor-pointer"
                  >
                    <Heart
                      size={20}
                      strokeWidth={1.5}
                      className={
                        savedItems.includes(item.id)
                          ? "text-red-500 fill-red-500"
                          : "text-white drop-shadow-md"
                      }
                    />
                  </div>
                  {/* Price badge */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                    <span className="text-xs">${item.price}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="text-sm text-gray-900 truncate">{item.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ImageWithFallback
                      src={item.sellerAvatar}
                      alt={item.sellerName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[11px] text-gray-400">
                      {item.sellerName}
                    </span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">
                      {item.postedAt}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Search size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No items found</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
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

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        savedItemIds={savedItems}
        onToggleSave={toggleSave}
      />
    </div>
  );
}