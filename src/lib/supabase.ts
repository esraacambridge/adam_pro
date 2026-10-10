import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  platform: string;
  genre: string;
  image_url: string;
  badge: string | null;
  rating: string;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type ProductInput = Omit<Product, 'id' | 'created_at'>;
