import { MapPin } from "lucide-react";

interface PickupMapProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    isOnCampus: boolean;
  };
}

export function PickupMap({ location }: PickupMapProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <MapPin size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">Pickup Location</span>
      </div>
      
      <div className="rounded-xl overflow-hidden border border-gray-100">
        {/* Map placeholder */}
        <div className="relative h-36 bg-gray-50">
          {/* Grid lines to simulate map */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#999" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Roads */}
          <svg className="absolute inset-0 w-full h-full">
            <line x1="0" y1="55%" x2="100%" y2="55%" stroke="#ddd" strokeWidth="3" />
            <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#ddd" strokeWidth="3" />
            <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#eee" strokeWidth="2" />
            <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#eee" strokeWidth="2" />
          </svg>
          
          {/* Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
            <div className="relative">
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/10 rounded-full blur-sm" />
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-black mx-auto -mt-0.5" />
            </div>
          </div>
          
          {location.isOnCampus && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              On Campus
            </div>
          )}
        </div>
        
        {/* Location details */}
        <div className="p-3 bg-white">
          <p className="text-sm text-black">{location.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{location.address}</p>
          <button className="mt-2 text-[11px] text-[#0064B1] flex items-center gap-1">
            <MapPin size={10} />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  );
}
