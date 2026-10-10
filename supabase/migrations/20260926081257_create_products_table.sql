/*
# Create products table and storage bucket for Adam Attia Games

## Overview
Creates the core `products` table that serves as the single source of truth for all games
displayed on the storefront. The admin dashboard reads and writes this table; the public
storefront reads it. Also creates a public storage bucket for product image uploads.

## New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name
  - `description` (text, not null) — short product description
  - `price` (numeric, not null) — current price in EGP
  - `old_price` (numeric, nullable) — original price before discount, in EGP
  - `platform` (text, not null) — e.g. PC, PlayStation, Xbox, Nintendo
  - `genre` (text, not null) — e.g. أكشن, مغامرات, سباقات
  - `image_url` (text, not null) — URL to product image (storage path or external URL)
  - `badge` (text, nullable) — optional badge like "-20%" or "جديد"
  - `rating` (text, not null default '4.5') — rating string e.g. "4.9"
  - `is_available` (boolean, not null default true) — product availability toggle
  - `sort_order` (integer, not null default 0) — manual ordering
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `products`.
- SELECT: public (anon + authenticated) — storefront must read without login.
- INSERT / UPDATE / DELETE: authenticated only — admin dashboard operations.
- Storage bucket `product-images` is public for reads; writes restricted to authenticated.

## Notes
1. The storefront uses the anon key, so the SELECT policy MUST include `anon`.
2. Admin operations require an authenticated session (email/password sign-in).
3. Prices are stored as numeric and displayed in EGP (جنيه مصري).
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10, 2) NOT NULL,
  old_price numeric(10, 2),
  platform text NOT NULL,
  genre text NOT NULL,
  image_url text NOT NULL,
  badge text,
  rating text NOT NULL DEFAULT '4.5',
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read: storefront (anon key) can see all products
DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin insert: only authenticated users can add products
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin update: only authenticated users can edit products
DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products"
  ON products FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- Admin delete: only authenticated users can remove products
DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_upload_product_images" ON storage.objects;
CREATE POLICY "admin_upload_product_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_update_product_images" ON storage.objects;
CREATE POLICY "admin_update_product_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "admin_delete_product_images" ON storage.objects;
CREATE POLICY "admin_delete_product_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
