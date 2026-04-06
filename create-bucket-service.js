import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzydpqilvyjqjbhzgzhq.supabase.co';
// Using the MCP key provided by the user
const supabaseServiceKey = 'sbp_23894f30ad908d0505d14ab4b7590fa2b730177d';

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