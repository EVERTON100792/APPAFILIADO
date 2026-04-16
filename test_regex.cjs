async function run() {
  const htmlUrl = 'https://shopee.com.br/product/1787967430/28344488489';
  const resHtml = await fetch(htmlUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html'
    }
  });
  const html = await resHtml.text();
  const match = html.match(/"images":(\[.*?\])/);
  if (match) {
     console.log('Match JSON array string:', match[1]);
     try {
       const arr = JSON.parse(match[1]);
       console.log('Successfully parsed array of length:', arr.length);
     } catch(e) {
       console.log('JSON parse error:', e.message);
     }
  } else { 
     console.log('not found'); 
  }
} run();
