import logoImage from "figma:asset/f03ed9e7219317681d7b386a42606aba55bf52f9.png";

interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 120, className = "" }: AppIconProps) {
  return (
    <img
      src={logoImage}
      alt="Mav Market Logo"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
}