import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivxhpilvtahijccviwsi.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2eGhwaWx2dGFoaWpjY3Zpd3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDI3MjIsImV4cCI6MjA4ODU3ODcyMn0.eio75Xjzk7QxfGFy7NeF6j_k5Pu08iGgMpYYmh2Q8rc'

export const supabase = createClient(supabaseUrl, supabaseKey)
