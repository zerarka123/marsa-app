export type BoatCategory =
  | 'صيد' | 'نزهة' | 'يخوت' | 'جت سكي' | 'مطاطي' | 'صغير' | 'معدات' | 'مقطورات' | 'رسو';

export type FuelType = 'بنزين' | 'مازوت' | '—';
export type Condition = 'جديد' | 'مستعمل';

export interface Seller {
  name: string;
  kind: 'فرد' | 'وكالة';
  phone: string;
  wilaya: string;
}

export interface Boat {
  id: number;
  title: string;
  category: BoatCategory;
  wilaya: string;
  price: number;
  year: number | null;
  length: number | null; // متر
  negotiable: boolean;
  engine: string;
  fuel: FuelType;
  condition: Condition;
  images: string[];
  description: string;
  seller: Seller;
  postedAt: string;
}

// الولايات الساحلية الـ14 (كلها وجهات سياحية بحرية)
export const wilayas = [
  'الكل', 'الطارف', 'عنابة', 'سكيكدة', 'جيجل', 'بجاية', 'تيزي وزو', 'بومرداس',
  'الجزائر', 'تيبازة', 'الشلف', 'مستغانم', 'وهران', 'عين تموشنت', 'تلمسان',
];

export const fmtPrice = (n: number) =>
  new Intl.NumberFormat('fr-DZ').format(n).replace(/[\u202f\u00a0]/g, ' ') + ' دج';

// ───────── الدليل البحري ─────────
export type BusinessKind = 'مورّد' | 'ورشة بناء سفن' | 'قطع غيار';

export interface Business {
  id: number;
  name: string;
  kind: BusinessKind;
  wilaya: string;
  address: string;
  phone: string;
  specialties: string[];
  hours: string;
  verified: boolean;
}

export const businessKinds: BusinessKind[] = ['مورّد', 'ورشة بناء سفن', 'قطع غيار'];
