import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://vzydpqilvyjqjbhzgzhq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4');

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
