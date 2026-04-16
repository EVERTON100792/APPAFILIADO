async function run() {
  try {
    const url = 'https://shopee.com.br/product/1787967430/28344488489';
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html'
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    const match = html.match(/"images":(\[.*?\])/);
    if (match) {
        let arr = JSON.parse(match[1]);
        console.log("Success with corsproxy.io! Extracted", arr.length);
    } else {
        console.log("No images found via corsproxy.io");
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
