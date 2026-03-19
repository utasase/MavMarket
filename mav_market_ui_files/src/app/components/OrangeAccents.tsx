// Decorative orange accent components for the Mav Market app

export function FlameAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z"
        fill="#F58025"
        opacity="0.2"
      />
      <path
        d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z"
        stroke="#F58025"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8C12 8 10 9.5 10 11C10 12.1046 10.8954 13 12 13C13.1046 13 14 12.1046 14 11C14 9.5 12 8 12 8Z"
        fill="#F58025"
      />
    </svg>
  );
}

export function HorseShoeAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 18V12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12V18"
        stroke="#F58025"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="6" cy="18" r="1.5" fill="#F58025" />
      <circle cx="18" cy="18" r="1.5" fill="#F58025" />
      <circle cx="6" cy="14" r="1" fill="#F58025" />
      <circle cx="18" cy="14" r="1" fill="#F58025" />
    </svg>
  );
}

export function ShoppingBagAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6H18L20 20H4L6 6Z"
        stroke="#F58025"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#F58025"
        fillOpacity="0.1"
      />
      <path
        d="M9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10"
        stroke="#F58025"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarBurstAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L12 7M12 17L12 22M22 12L17 12M7 12L2 12M19.0711 4.92893L15.5355 8.46447M8.46447 15.5355L4.92893 19.0711M19.0711 19.0711L15.5355 15.5355M8.46447 8.46447L4.92893 4.92893"
        stroke="#F58025"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="#F58025" />
    </svg>
  );
}

export function MavWaveDecoration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        d="M0 10 Q 25 0, 50 10 T 100 10 T 150 10 T 200 10"
        stroke="#F58025"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}
