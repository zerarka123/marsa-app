import { Anchor, Crown, Fish, LifeBuoy, Sailboat, Ship, Truck, Wrench, Zap } from 'lucide-react';
import type { BoatCategory } from '../data';

export const categoryMeta: { id: BoatCategory; label: string; icon: typeof Ship }[] = [
  { id: 'صيد', label: 'قوارب صيد', icon: Fish },
  { id: 'نزهة', label: 'قوارب نزهة', icon: Sailboat },
  { id: 'يخوت', label: 'يخوت', icon: Crown },
  { id: 'جت سكي', label: 'جت سكي', icon: Zap },
  { id: 'مطاطي', label: 'قوارب مطاطية', icon: LifeBuoy },
  { id: 'صغير', label: 'قوارب صغيرة', icon: Ship },
  { id: 'معدات', label: 'محركات ومعدات', icon: Wrench },
  { id: 'مقطورات', label: 'مقطورات', icon: Truck },
  { id: 'رسو', label: 'أماكن رسو', icon: Anchor },
];
