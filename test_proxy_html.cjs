async function run() { 
  const url = 'https://shopee.com.br/product/1787967430/28344488489'; 
  const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(url); 
  const res = await fetch(proxyUrl); 
  const data = await res.json(); 
  try { 
    const html = data.contents;
    console.log("HTML length:", html.length);
    if (html.includes("captcha")) {
      console.log("Found captcha!");
    }
    const match = html.match(/"images":\[(.*?)\]/);
    if (match) {
      console.log("Found images in HTML:", match[0].substring(0, 300));
    } else {
      console.log("Images not found in HTML");
      const match2 = html.match(/image: '(.*?)'/);
      if (match2) console.log("Found single image", match2);
    }
  } catch(e) { 
    console.log('err', e.message); 
  } 
} 
run();
