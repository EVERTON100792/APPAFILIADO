import { createClient } from '@supabase/supabase-js';
import { productDB } from './src/data/productDB';

const supabase = createClient('https://vzydpqilvyjqjbhzgzhq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4');

async function run() {
  const data = [];
  
  for (const [niche, items] of Object.entries(productDB)) {
    for (const item of items) {
      data.push({
        title: item.title,
        query: item.query,
        image: 'https://placehold.co/400x400/121212/ffffff?text=' + encodeURIComponent(item.title),
        commission: String(item.commission_pct) + '%',
        sales: item.sales,
        niche: niche
      });
    }
  }

  const chunkSize = 50;
  let successCount = 0;
  
  for (let i=0; i<data.length; i+=chunkSize) {
     const chunk = data.slice(i, i+chunkSize);
     const { error } = await supabase.from('products').insert(chunk);
     if(error) {
       console.error('Error inserting chunk:', error);
     } else {
       successCount += chunk.length;
     }
  }
  
  console.log('Migracao concluida! Inseridos: ' + successCount + ' de ' + data.length + ' produtos!');
}
run();
