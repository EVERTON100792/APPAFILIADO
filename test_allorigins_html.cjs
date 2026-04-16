async function run() { 
  const url = 'https://shopee.com.br/product/1787967430/28344488489'; 
  const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(url); 
  const res = await fetch(proxyUrl); 
  const data = await res.json(); 
  try { 
    const html = data.contents;
    const matches = [...html.matchAll(/"images":(\[.*?\])/g)];
    let images = [];
    for (let i = 0; i < matches.length; i++) {
        try {
            const arr = JSON.parse(matches[i][1]);
            if (arr.length > images.length) images = arr;
        } catch(e) {}
    }
    console.log("Images via allorigins:", images.length);
  } catch(e) { 
    console.log('err', e.message); 
  } 
} 
run();
