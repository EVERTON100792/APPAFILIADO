import { createClient } from '@supabase/supabase-js';
import { productDB } from './src/data/productDB';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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
