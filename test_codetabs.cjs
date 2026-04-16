async function run() {
  try {
    const url = 'https://shopee.com.br/product/1787967430/28344488489';
    const proxyUrl = "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url);
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      }
    });
    const html = await res.text();
    const matches = [...html.matchAll(/"images":(\[.*?\])/g)];
    if (matches.length > 0) {
        console.log("Success with codetabs! Found", matches.length, "groups");
    } else {
        console.log("No images found.", html.substring(0, 100));
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
