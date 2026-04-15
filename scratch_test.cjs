const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vzydpqilvyjqjbhzgzhq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4'
);

// We need a shop_id and item_id. I will just query one first or pass dummy test values.
// Let's first search products to get a valid item_id
async function test() {
  const { data: searchData, error: searchError } = await supabase.functions.invoke('shopee-prod-search', {
    body: {
      action: 'search_products',
      params: { keyword: 'maquiagem', page_size: 1, page_number: 1, sort_by: 3 }
    }
  });
  
  if (searchError) {
    console.error('Search error:', searchError);
    return;
  }
  
  const nodes = searchData?.data?.nodes || searchData?.data?.productOfferV2?.nodes || searchData?.data?.items || [];
  if (nodes.length === 0) {
    console.log('No nodes found', searchData);
    return;
  }
  
  const item = nodes[0];
  const shopId = item.shopId || item.shop_id;
  const itemId = item.itemId || item.item_id;
  console.log(`Found item shop_id: ${shopId}, item_id: ${itemId}`);
  
  const { data: detailData, error: detailError } = await supabase.functions.invoke('shopee-prod-search', {
    body: {
      action: 'get_item_detail',
      params: { shop_id: shopId, item_id: itemId }
    }
  });

  if (detailError) {
    console.error('Detail error:', detailError);
    return;
  }
  
  console.log('Detail data:', JSON.stringify(detailData, null, 2));
}

test();
