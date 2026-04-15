async function run() { 
  const url = 'https://shopee.com.br/api/v4/item/get?itemid=28344488489&shopid=1787967430'; 
  const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(url); 
  const res = await fetch(proxyUrl); 
  const data = await res.json(); 
  try { 
    const parsed = JSON.parse(data.contents); 
    console.log('Parsed error:', parsed.error); 
    console.log('Images array length:', (parsed.data?.images || parsed.item?.images || []).length); 
    if ((parsed.data?.images || parsed.item?.images || []).length > 0) {
      console.log('Images:', parsed.data.images || parsed.item.images);
    }
  } catch(e) { 
    console.log('err', e.message); 
  } 
} 
run();
