async function run() {
  try {
    const htmlUrl = `https://shopee.com.br/product/1787967430/28344488489`;
    const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(htmlUrl);
    const proxyRes = await fetch(proxyUrl);
    const data = await proxyRes.json();
    const html = data.contents;
    
    if (!html) throw new Error("No HTML from proxy");

    const matches = [...html.matchAll(/"images":(\[.*?\])/g)];
    let extractedImages = [];
    for (let i = 0; i < matches.length; i++) {
        try {
        const arr = JSON.parse(matches[i][1]);
        if (arr.length > extractedImages.length) extractedImages = arr;
        } catch(e) {}
    }
    console.log(`[ShopeeService] Sucesso no fallback! Extraídas ${extractedImages.length} imagens.`);
  } catch(err) {
    console.log("[ShopeeService] Fallback proxy falhou:", err);
  }
}
run();
