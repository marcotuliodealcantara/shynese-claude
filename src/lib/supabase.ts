import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdqnetlyvkdbktvocvpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcW5ldGx5dmtkYmt0dm9jdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjcyMjIsImV4cCI6MjA3NzA0MzIyMn0.0d1yLOT7DEBy6loOZ8_TC24d0q_3FHN7R1YsoPdeNQA';

export const supabase = createClient(supabaseUrl, supabaseKey);