/**
 * Grouped product categories for e-commerce onboarding.
 * Each top-level category maps to a list of sub-categories.
 */

import {
  Shirt,
  Sparkles,
  Coffee,
  Smartphone,
  Home,
  Heart,
  Dumbbell,
  Gem,
  PawPrint,
  Baby,
  ToyBrick,
  BookOpen,
  Car,
  Laptop,
  type LucideIcon,
} from 'lucide-react'

export interface ProductCategory {
  label: string
  icon: LucideIcon
  subs: string[]
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    label: 'Fashion & Apparel',
    icon: Shirt,
    subs: [
      'Streetwear',
      'Luxury & Designer',
      'Activewear',
      'Sustainable fashion',
      'Vintage & Thrift',
      'Lingerie & Loungewear',
      'Outerwear',
      'Footwear',
      'Accessories',
    ],
  },
  {
    label: 'Beauty & Skincare',
    icon: Sparkles,
    subs: [
      'Skincare',
      'Makeup',
      'Haircare',
      'Fragrance',
      'Nails',
      "Men's grooming",
      'Tools & Devices',
      'Clean beauty',
    ],
  },
  {
    label: 'Food & Beverage',
    icon: Coffee,
    subs: [
      'Snacks',
      'Coffee & Tea',
      'Meal prep & subscription',
      'Vegan & Plant-based',
      'Alcohol & Spirits',
      'Specialty grocery',
      'Confectionery',
      'Sauces & Condiments',
    ],
  },
  {
    label: 'Electronics & Gadgets',
    icon: Smartphone,
    subs: [
      'Phone accessories',
      'Smart home',
      'Wearables',
      'Audio & Headphones',
      'Cameras',
      'Computing & Tablets',
      'Gaming',
      'Drones',
    ],
  },
  {
    label: 'Home & Decor',
    icon: Home,
    subs: [
      'Furniture',
      'Kitchen & Dining',
      'Candles & Fragrance',
      'Plants',
      'Art & Wall decor',
      'Bedding & Bath',
      'Storage',
      'Lighting',
    ],
  },
  {
    label: 'Health & Wellness',
    icon: Heart,
    subs: [
      'Supplements & Vitamins',
      'CBD & Natural remedies',
      'Mental health',
      'Yoga & Meditation',
      'Sexual wellness',
      'Sleep',
      'Personal care',
    ],
  },
  {
    label: 'Sports & Fitness',
    icon: Dumbbell,
    subs: [
      'Gym wear',
      'Equipment & Weights',
      'Cycling',
      'Running',
      'Outdoor & Hiking',
      'Combat sports',
      'Yoga & Pilates',
      'Team sports',
    ],
  },
  {
    label: 'Jewelry & Watches',
    icon: Gem,
    subs: [
      'Fine jewelry',
      'Handmade jewelry',
      'Watches',
      'Body jewelry',
      'Engagement & Bridal',
      'Demi-fine',
    ],
  },
  {
    label: 'Pets',
    icon: PawPrint,
    subs: [
      'Dog supplies',
      'Cat supplies',
      'Food & Treats',
      'Accessories & Toys',
      'Aquatic & Reptile',
      'Health & Grooming',
    ],
  },
  {
    label: 'Kids & Baby',
    icon: Baby,
    subs: [
      'Clothing',
      'Toys & Games',
      'Education & Books',
      'Nursery & Bedding',
      'Strollers & Gear',
      'Feeding',
    ],
  },
  {
    label: 'Toys & Hobbies',
    icon: ToyBrick,
    subs: [
      'Board games',
      'Collectibles & Figures',
      'Model kits',
      'Crafts',
      'Outdoor toys',
      'Trading cards',
    ],
  },
  {
    label: 'Books & Stationery',
    icon: BookOpen,
    subs: [
      'Books',
      'Notebooks & Journals',
      'Pens & Writing',
      'Planners',
      'Art supplies',
      'Office accessories',
    ],
  },
  {
    label: 'Automotive',
    icon: Car,
    subs: [
      'Accessories',
      'Detailing & Care',
      'Parts',
      'Motorcycle gear',
      'EV accessories',
    ],
  },
  {
    label: 'Digital & SaaS',
    icon: Laptop,
    subs: [
      'Software',
      'Mobile apps',
      'Courses & Education',
      'Templates & Assets',
      'Memberships',
    ],
  },
]
