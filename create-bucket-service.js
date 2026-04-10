import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Using the service role key from environment
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    
    console.log('Bucket created successfully:', data);
  } catch (err) {
    console.error('Exception:', err);
  }
}

createBucket();