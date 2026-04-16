async function run() {
  const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://shopee.com.br/product/1787967430/28344488489');
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/"images":(\[.*?\])/);
  if (match) {
    console.log("Success with allorigins raw! Images array:", JSON.parse(match[1]).length);
  } else {
    console.log("No images found.", text.substring(0, 100));
  }
}
run();
