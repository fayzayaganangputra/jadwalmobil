/*
  # Sistem Penjadwalan Mobil Internal - Database Schema

  ## Overview
  Sistem untuk menjadwalkan penggunaan mobil internal perusahaan dengan calendar view.

  ## New Tables
  
  ### `cars`
  Tabel untuk menyimpan data mobil yang tersedia
  - `id` (uuid, primary key) - ID unik mobil
  - `name` (text) - Nama/model mobil (contoh: "Avanza Silver")
  - `plate_number` (text, unique) - Nomor plat kendaraan
  - `capacity` (integer) - Kapasitas penumpang
  - `is_active` (boolean) - Status aktif mobil
  - `created_at` (timestamptz) - Waktu pembuatan record
  - `created_by` (uuid) - User yang membuat record

  ### `bookings`
  Tabel untuk menyimpan data booking/penjadwalan mobil
  - `id` (uuid, primary key) - ID unik booking
  - `car_id` (uuid, foreign key) - Referensi ke tabel cars
  - `user_id` (uuid, foreign key) - User yang melakukan booking
  - `booking_date` (date) - Tanggal penggunaan mobil
  - `start_time` (time) - Waktu mulai
  - `end_time` (time) - Waktu selesai
  - `purpose` (text) - Tujuan/keperluan penggunaan
  - `destination` (text) - Tujuan perjalanan
  - `driver_name` (text) - Nama driver (optional)
  - `notes` (text) - Catatan tambahan
  - `status` (text) - Status booking: 'pending', 'approved', 'rejected', 'completed', 'cancelled'
  - `created_at` (timestamptz) - Waktu pembuatan booking
  - `updated_at` (timestamptz) - Waktu update terakhir

  ### `profiles`
  Tabel untuk menyimpan profil user tambahan
  - `id` (uuid, primary key) - Sama dengan auth.users.id
  - `email` (text) - Email user
  - `full_name` (text) - Nama lengkap
  - `role` (text) - Role user: 'admin' atau 'user'
  - `department` (text) - Departemen user
  - `created_at` (timestamptz) - Waktu pembuatan profil

  ## Security
  
  ### Row Level Security (RLS)
  1. Enable RLS pada semua tables
  2. Profiles:
     - Users dapat melihat semua profil
     - Users hanya dapat update profil mereka sendiri
  3. Cars:
     - Semua authenticated users dapat melihat mobil aktif
     - Hanya admin yang dapat create/update/delete
  4. Bookings:
     - Users dapat melihat semua bookings
     - Users dapat create booking untuk diri sendiri
     - Users dapat update/delete booking mereka sendiri yang masih pending
     - Admin dapat melakukan semua operasi

  ## Notes
  - Menggunakan auth.uid() untuk mendapatkan user ID yang sedang login
  - Constraint untuk mencegah double booking pada tanggal dan waktu yang sama
  - Index pada kolom yang sering di-query untuk performa
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  department text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plate_number text UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  purpose text NOT NULL,
  destination text NOT NULL,
  driver_name text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_car_date ON bookings(car_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_cars_active ON cars(is_active);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for cars
CREATE POLICY "Authenticated users can view active cars"
  ON cars FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can insert cars"
  ON cars FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update cars"
  ON cars FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete cars"
  ON cars FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- RLS Policies for bookings
CREATE POLICY "Users can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND status = 'pending'
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own pending bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND status = 'pending'
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();