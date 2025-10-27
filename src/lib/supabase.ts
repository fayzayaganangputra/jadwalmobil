import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'user';
          department: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'user';
          department?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'user';
          department?: string;
          created_at?: string;
        };
      };
      cars: {
        Row: {
          id: string;
          name: string;
          plate_number: string;
          capacity: number;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          plate_number: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          plate_number?: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          car_id: string;
          user_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          purpose: string;
          destination: string;
          driver_name: string;
          notes: string;
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          user_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          purpose: string;
          destination: string;
          driver_name?: string;
          notes?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          user_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          purpose?: string;
          destination?: string;
          driver_name?: string;
          notes?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
