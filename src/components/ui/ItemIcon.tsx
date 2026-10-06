import { Baby, BedDouble, Cross, Droplets, Flashlight, Milk, Package, Sparkles, type LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  droplets: Droplets,
  package: Package,
  cross: Cross,
  bed: BedDouble,
  milk: Milk,
  baby: Baby,
  flashlight: Flashlight,
  sparkles: Sparkles,
};

export function ItemIcon({ icon, className = 'h-5 w-5' }: { icon: string; className?: string }) {
  const C = MAP[icon] ?? Package;
  return <C className={className} />;
}
