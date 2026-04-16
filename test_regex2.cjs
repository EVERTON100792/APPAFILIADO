async function run() {
  const htmlUrl = 'https://shopee.com.br/product/1787967430/28344488489';
  const resHtml = await fetch(htmlUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html'
    }
  });
  const html = await resHtml.text();
  const matches = [...html.matchAll(/"images":(\[.*?\])/g)];
  console.log("Found matches:", matches.length);
  for (let i = 0; i < matches.length; i++) {
     try {
       const arr = JSON.parse(matches[i][1]);
       console.log(`Match ${i} parsed length:`, arr.length);
       if (arr.length > 2) console.log(arr);
     } catch(e) {}
  }
} run();
