async function run() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://vzydpqilvyjqjbhzgzhq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4'
  );
  
  // Test search_products
  const { data, error } = await supabase.functions.invoke('shopee-prod-search', {
    body: {
      action: 'search_products',
      params: { keyword: 'cozinha', list_type: 0, sort_type: 1 }
    }
  });
  console.log("GraphQL Data:", JSON.stringify(data?.data?.productOfferV2?.nodes?.[0] || data?.data?.items?.[0] || 'no data', null, 2));
}
run();
