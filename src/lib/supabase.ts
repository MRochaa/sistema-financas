import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'INCOME' | 'EXPENSE'
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'INCOME' | 'EXPENSE'
          color: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'INCOME' | 'EXPENSE'
          color?: string
          user_id?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          type: 'INCOME' | 'EXPENSE'
          amount: number
          description: string | null
          date: string
          category_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          type: 'INCOME' | 'EXPENSE'
          amount: number
          description?: string | null
          date: string
          category_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'INCOME' | 'EXPENSE'
          amount?: number
          description?: string | null
          date?: string
          category_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}