async function run() { 
  const url = 'https://shopee.com.br/api/v4/item/get?itemid=28344488489&shopid=1787967430';
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  }); 
  const data = await res.json(); 
  console.log('JSON error:', data.error);

  const htmlUrl = 'https://shopee.com.br/product/1787967430/28344488489';
  const resHtml = await fetch(htmlUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "text/html"
    }
  });
  const html = await resHtml.text();
  console.log("HTML length:", html.length);
  const match = html.match(/"images":\[(.*?)\]/);
  if (match) {
     console.log("Found images!");
  } else {
     console.log("No images fast regex");
     const m2 = html.match(/image: '(.*?)'/);
     if (m2) console.log("Single image found");
  }
} 
run();
