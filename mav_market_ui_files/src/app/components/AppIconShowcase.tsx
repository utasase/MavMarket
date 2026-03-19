import { AppIcon } from "./AppIcon";

export function AppIconShowcase() {
  const sizes = [
    { size: 1024, label: "1024×1024 (App Store)" },
    { size: 512, label: "512×512 (High-res)" },
    { size: 256, label: "256×256" },
    { size: 180, label: "180×180 (iOS)" },
    { size: 120, label: "120×120" },
    { size: 80, label: "80×80" },
    { size: 48, label: "48×48" },
    { size: 32, label: "32×32" },
  ];

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl text-black mb-2">Mav Market App Icon</h1>
          <p className="text-gray-500 text-sm">
            Official app icon design featuring the UTA shopping bag with Maverick "A" logo
          </p>
        </div>

        {/* Hero Icon */}
        <div className="flex justify-center mb-16">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 rounded-3xl">
            <AppIcon size={256} />
          </div>
        </div>

        {/* Size Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sizes.map(({ size, label }) => (
            <div
              key={size}
              className="flex flex-col items-center p-6 border border-gray-100 rounded-2xl bg-white hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl">
                <AppIcon size={size > 180 ? 120 : size} />
              </div>
              <p className="text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{size}px</p>
            </div>
          ))}
        </div>

        {/* Design Details */}
        <div className="mt-16 p-8 bg-gray-50 rounded-2xl">
          <h2 className="text-xl text-black mb-4">Design Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0065B1]" />
              <div>
                <p className="text-gray-900">UTA Blue</p>
                <p className="text-gray-400 text-xs">#0065B1 / #0064B1</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200" />
              <div>
                <p className="text-gray-900">White</p>
                <p className="text-gray-400 text-xs">#FFFFFF</p>
              </div>
            </div>
            <p className="text-gray-600 pt-2">
              The icon features a shopping bag with the UTA Maverick "A" logo and star,
              representing the student marketplace community at the University of Texas at Arlington.
            </p>
          </div>
        </div>

        {/* Download Instructions */}
        <div className="mt-8 p-6 bg-[#0065B1]/5 border border-[#0065B1]/10 rounded-xl">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> The logo is displayed at various sizes above.
            The original PNG has been imported directly from Figma and is used throughout the app.
          </p>
        </div>
      </div>
    </div>
  );
}