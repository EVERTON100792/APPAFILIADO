import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const data = JSON.parse(readFileSync('./tmp_products.json', 'utf-8'));
  const chunkSize = 50;
  for(let i=0; i<data.length; i+=chunkSize) {
     const chunk = data.slice(i, i+chunkSize);
     const { error } = await supabase.from('products').insert(chunk);
     if(error) console.error('Error inserting chunk:', error);
  }
  console.log('Migracao concluida para ' + data.length + ' produtos!');
}
run();
