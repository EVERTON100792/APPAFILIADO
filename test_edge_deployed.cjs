async function run() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://vzydpqilvyjqjbhzgzhq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4'
  );
  const { data: detailData, error: detailError } = await supabase.functions.invoke('shopee-prod-search', {
    body: {
      action: 'get_item_detail',
      params: { shop_id: 1787967430, item_id: 28344488489 }
    }
  });
  console.log("Edge Response Images array length:", detailData?.images?.length);
  if (detailData?.images?.length > 0) {
     console.log("Sample:", detailData.images[0]);
  } else {
     console.log("No images!", JSON.stringify(detailData, null, 2));
  }
}
run();
