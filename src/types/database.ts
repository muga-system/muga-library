export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      databases: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      field_definitions: {
        Row: {
          id: string
          database_id: string
          tag: string
          label: string
          type: 'text' | 'number' | 'date' | 'select' | 'subfield'
          is_repeatable: boolean
          is_subfield: boolean
          parent_tag: string | null
          required: boolean
          order_index: number
        }
        Insert: {
          id?: string
          database_id: string
          tag: string
          label: string
          type?: 'text' | 'number' | 'date' | 'select' | 'subfield'
          is_repeatable?: boolean
          is_subfield?: boolean
          parent_tag?: string | null
          required?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          database_id?: string
          tag?: string
          label?: string
          type?: 'text' | 'number' | 'date' | 'select' | 'subfield'
          is_repeatable?: boolean
          is_subfield?: boolean
          parent_tag?: string | null
          required?: boolean
          order_index?: number
        }
      }
      records: {
        Row: {
          id: string
          database_id: string
          mfn: number
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          database_id: string
          mfn?: number
          data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          database_id?: string
          mfn?: number
          data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      cdu_classes: {
        Row: {
          id: string
          code: string
          title: string
          parent_code: string | null
          description: string | null
          examples: Json | null
        }
        Insert: {
          id?: string
          code: string
          title: string
          parent_code?: string | null
          description?: string | null
          examples?: Json | null
        }
        Update: {
          id?: string
          code?: string
          title?: string
          parent_code?: string | null
          description?: string | null
          examples?: Json | null
        }
      }
    }
  }
}

export type DatabaseRow = Database['public']['Tables']['databases']['Row']
export type FieldDefinitionRow = Database['public']['Tables']['field_definitions']['Row']
export type RecordRow = Database['public']['Tables']['records']['Row']
export type CduClassRow = Database['public']['Tables']['cdu_classes']['Row']
