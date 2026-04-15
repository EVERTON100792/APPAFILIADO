async function run() { 
  const url = 'https://shopee.com.br/product/1787967430/28344488489'; 
  const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(url); 
  const res = await fetch(proxyUrl); 
  const data = await res.json(); 
  try { 
    const html = data.contents;
    // shopee JSON state is usually in a script tag: window.__SHOPEE_ITEM_DETAIL__ or similar
    // or inside json-ld
    console.log("HTML length:", html.length);
    if (html.includes("captcha")) {
      console.log("Found captcha!");
    }
    const match = html.match(/("images":\[.*?\])/);
    if (match) {
      console.log("Found images in HTML:", match[1].substring(0, 100));
    } else {
      console.log("Images not found in HTML");
    }
  } catch(e) { 
    console.log('err', e.message); 
  } 
} 
run();
