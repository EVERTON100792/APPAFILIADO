const fetch = require('node-fetch');

async function testAllOrigins() {
  const url = 'https://shopee.com.br/api/v4/item/get?itemid=28344488489&shopid=1787967430';
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  
  const res = await fetch(proxyUrl);
  const data = await res.json();
  
  console.log("Status:", res.status);
  if (data.contents) {
    try {
      const parsed = JSON.parse(data.contents);
      console.log("Parsed error:", parsed.error);
      console.log("Images:", parsed.data?.images || parsed.item?.images);
    } catch(e) {
      console.log("Raw contents snippet:", data.contents.substring(0, 100));
    }
  } else {
    console.log("No contents");
  }
}

testAllOrigins();
