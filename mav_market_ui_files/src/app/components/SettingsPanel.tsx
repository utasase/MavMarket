import { useState } from "react";
import { X, ChevronRight, Bell, Shield, HelpCircle, Info, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ItemDetail } from "./ItemDetail";
import { listings, type ListingItem } from "../data/mockData";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItemIds: string[];
  onToggleSave: (id: string) => void;
}

type ViewMode = "main" | "notifications" | "saved";

export function SettingsPanel({ isOpen, onClose, savedItemIds, onToggleSave }: SettingsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);

  const savedItems = listings.filter((item) => savedItemIds.includes(item.id));

  const handleClose = () => {
    setViewMode("main");
    onClose();
  };

  const handleBackToMain = () => {
    setViewMode("main");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[101] flex flex-col"
          >
            {viewMode === "main" && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h2 className="text-lg text-black">Settings and Activity</h2>
                  <button onClick={handleClose} className="p-2 -mr-2">
                    <X size={22} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Saved Section */}
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setViewMode("saved")}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Heart size={20} strokeWidth={1.5} />
                        <span className="text-sm text-black">Saved Listings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{savedItems.length}</span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </button>
                  </div>

                  {/* Settings Section */}
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <h3 className="text-xs text-gray-500 uppercase tracking-wide">Settings</h3>
                    </div>
                    <button
                      onClick={() => setViewMode("notifications")}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Bell size={20} strokeWidth={1.5} />
                        <span className="text-sm text-black">Notifications</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield size={20} strokeWidth={1.5} />
                        <span className="text-sm text-black">Privacy and Security</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <HelpCircle size={20} strokeWidth={1.5} />
                        <span className="text-sm text-black">Help and Support</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Info size={20} strokeWidth={1.5} />
                        <span className="text-sm text-black">About</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {viewMode === "notifications" && (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <button onClick={handleBackToMain} className="p-2 -ml-2">
                    <X size={22} strokeWidth={1.5} />
                  </button>
                  <h2 className="text-lg text-black">Notification Preferences</h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="space-y-3">
                    <NotificationToggle 
                      label="New Messages" 
                      description="Get notified when you receive a message"
                    />
                    <NotificationToggle 
                      label="Price Drops" 
                      description="Alert when saved items go on sale"
                    />
                    <NotificationToggle 
                      label="New Listings" 
                      description="Notify about new items in your categories"
                    />
                    <NotificationToggle 
                      label="Item Sold" 
                      description="Alert when your listing sells"
                    />
                  </div>
                </div>
              </>
            )}

            {viewMode === "saved" && (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <button onClick={handleBackToMain} className="p-2 -ml-2">
                    <X size={22} strokeWidth={1.5} />
                  </button>
                  <h2 className="text-lg text-black">Saved Listings</h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {savedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
                      <Heart size={32} className="mb-2 opacity-30" />
                      <p className="text-sm">No saved items yet</p>
                      <p className="text-xs text-gray-300 mt-1 text-center">
                        Save items you love to view them here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {savedItems.map((item) => (
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Item Detail Overlay */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="absolute inset-0 z-50"
                >
                  <ItemDetail
                    item={selectedItem}
                    onBack={() => setSelectedItem(null)}
                    isSaved={savedItemIds.includes(selectedItem.id)}
                    onToggleSave={() => onToggleSave(selectedItem.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationToggle({ label, description }: { label: string; description: string }) {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50">
      <div className="flex-1">
        <p className="text-sm text-black">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-[#0064B1]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
