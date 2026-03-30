const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');

// ============================================================
// 1. Corrigir handleDownload — passar existingVideoEl
// ============================================================
const OLD_DOWNLOAD = `  const handleDownload = async () => {
    if (!videoData?.url) return;
    
    setIsProcessing(true);
    showToast("REPROCESSANDO MÍDIA COM EFEITOS... ⚡");
    
    try {
      const processor = new VideoProcessor();
      const options: ProcessingOptions = {
        filter: activeFilter,
        legend: videoLegend,
        isMuted: isMuted,
        transition: activeTransition as any,
        trimStart,
        trimEnd: trimEnd || undefined,
        transitionTimestamps,
        videoId: videoData.id
      };
      
      await processor.processAndDownload(videoData.url, options);
      showToast("VÍDEO EXPORTADO COM SUCESSO! 🚀");
    } catch (error: any) {
      console.error("Video Processing Error:", error);
      showToast("ERRO AO PROCESSAR VÍDEO. TENTANDO DOWNLOAD DIRETO...");
      window.open(videoData.url, '_blank');
    } finally {
      setIsProcessing(false);
    }
  };`;

const NEW_DOWNLOAD = `  const handleDownload = async () => {
    if (!videoData?.url) return;
    setIsProcessing(true);
    showToast("RENDERIZANDO VÍDEO COM EFEITOS... ⚡");
    try {
      const processor = new VideoProcessor();
      const options: ProcessingOptions = {
        filter: activeFilter,
        legend: videoLegend,
        isMuted: isMuted,
        transition: activeTransition as any,
        trimStart,
        trimEnd: trimEnd || undefined,
        transitionTimestamps,
        videoId: videoData.id,
        // Passa o vídeo já carregado na UI — elimina CORS totalmente
        existingVideoEl: videoRef.current || undefined,
      };
      await processor.processAndDownload(videoData.url, options);
      showToast("VÍDEO EXPORTADO COM SUCESSO! 🚀");
    } catch (error: any) {
      console.error("Video Processing Error:", error);
      showToast("ERRO AO PROCESSAR — TENTE NOVAMENTE 📲");
    } finally {
      setIsProcessing(false);
    }
  };`;

if (!content.includes(OLD_DOWNLOAD.substring(0, 50))) {
  console.error('handleDownload NAO ENCONTRADO');
} else {
  content = content.replace(OLD_DOWNLOAD, NEW_DOWNLOAD);
  console.log('1. handleDownload: OK');
}

// ============================================================
// 2. Remover preços das legendas em generateCreativeLegend
// ============================================================
// Substituir ' + price + ' por espaço vazio em contextos de hook/body
content = content
  // Na função generateCreativeLegend — hooks que incluem price
  .replace(/So \$\{price\} na Shopee! /g, 'na Shopee! ')
  .replace(/So \$\{price\}! O/g, 'O')
  .replace(/ por so \$\{price\} /g, ' ')
  .replace(/ por \$\{price\}! /g, '! ')
  .replace(/ por \$\{price\} /g, ' ')
  .replace(/ custa \$\{price\}! /g, '! ')
  .replace(/custo: \$\{price\} /g, '')
  .replace(/\+ ' por so ' \+ price \+ '!/g, "+ '!")
  .replace(/\+ price \+ '!'/g, "+ '!'")
  .replace(/'Cozinhar ficou muito mais facil com o ' \+ title\.split\(' '\)\.slice\(0,3\)\.join\(' '\) \+ '\! Custo: ' \+ price \+ ' na Shopee! 🍳',/g,
           "'Cozinhar ficou muito mais facil com o ' + title.split(' ').slice(0,3).join(' ') + '! Adoro esse achado na Shopee! 🍳',")
  .replace(/\+ price \+ ' na Shopee!/g, "+ ' na Shopee!")
  .replace(/\+ price \+ '!\\)\\\\n\\\\n'/g, "+ '!\\n\\n'");

// Substituir nos bodies — remover "apenas ${price}" e "por ${price}"
content = content
  .replace(/e apenas \$\{price\}, /g, '')
  .replace(/Por \$\{price\} com /g, 'Com ')
  .replace(/So \$\{price\} e vem /g, 'e vem ')
  .replace(/por \$\{price\} ta/g, 'ta')
  .replace(/ \(\$\{price\}!\)/g, '');

// Remover price de hooks que usam template strings no script já gerado
content = content
  .replace(/` por so \$\{price\} ta na Shopee!/g, '` na Shopee!')
  .replace(/` por \$\{price\}!/g, '`!')
  .replace(/` custa \$\{price\}!/g, '`!')
  .replace(/ por \$\{price\}`/g, '`')
  .replace(/\) por \$\{price\}\)`/g, ')!')
  .replace(/por so \$\{price\}`/g, '`')
  .replace(/So \$\{price\}! O \$\{/g, 'O ${')
  .replace(/ por nur \$\{price\}/g, '')
  .replace(/Custo: \$\{price\}/g, '')
  .replace(/: \$\{price\}`/g, '`')
  .replace(/ por apenas \$\{price\}/g, '')
  .replace(/, e apenas \$\{price\}/g, '')
  .replace(/ por \$\{price\} com /g, ' com ')
  .replace(/So \$\{price\} e vem/g, 'Vem')
  .replace(/ \(\$\{price\}!\)/g, '');

console.log('2. Precos: removidos das legendas');

// ============================================================
// 3. Adicionar busca na Shopee na seleção de produto
//    (encontrar onde exibe o produto selecionado e adicionar botão)
// ============================================================
// Localizar o card do produto selecionado antes de "Scan" ou "Analisar"
const SEARCH_BTN_OLD = `                    <h3 className="text-lg font-black italic uppercase leading-tight truncate">{selectedProduct?.title || 'Carregando...'}</h3>`;
const SEARCH_BTN_NEW = `                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <h3 className="text-lg font-black italic uppercase leading-tight truncate">{selectedProduct?.title || 'Carregando...'}</h3>
                      {selectedProduct?.link && (
                        <a
                          href={\`https://shopee.com.br/search?keyword=\${encodeURIComponent(selectedProduct.title)}\`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-400 hover:bg-orange-500/25 transition-all w-fit"
                        >
                          🛒 BUSCAR NA SHOPEE
                        </a>
                      )}
                    </div>`;

if (!content.includes(SEARCH_BTN_OLD.substring(0, 50))) {
  console.error('SEARCH_BTN: trecho nao encontrado');
} else {
  content = content.replace(SEARCH_BTN_OLD, SEARCH_BTN_NEW);
  console.log('3. Botão Buscar na Shopee: OK');
}

// ============================================================
// 4. Textos informativos nos botões TikTok e Shopee
// ============================================================
const TIKTOK_BTN_OLD = `onClick={() => runAutomation('tiktok')}`;
const SHOPEE_BTN_OLD = `onClick={() => runAutomation('shopee')}`;

// Só vamos modificar o tooltip/text. Vamos procurar o layout dos botoes e adicionar subtitulos
const BTN_SECTION_OLD = `                    onClick={() => runAutomation('tiktok')}`;

// Mais seguro: procurar o bloco de botões de automação:
const AUTO_BTNS_OLD = `onClick={() => runAutomation('tiktok')}
                  className`;
const AUTO_BTNS_NEW = `onClick={() => runAutomation('tiktok')}
                  title="Copia a legenda e abre o TikTok. Cole o vídeo e a legenda, publique!"
                  className`;

if (content.includes(AUTO_BTNS_OLD)) {
  content = content.replace(AUTO_BTNS_OLD, AUTO_BTNS_NEW);
  console.log('4a. TikTok tooltip: OK');
}

const SHOPEE_AUTO_OLD = `onClick={() => runAutomation('shopee')}
                  className`;
const SHOPEE_AUTO_NEW = `onClick={() => runAutomation('shopee')}
                  title="Copia a legenda e abre o Shopee Vídeos. Cole o vídeo e a legenda, publique!"
                  className`;

if (content.includes(SHOPEE_AUTO_OLD)) {
  content = content.replace(SHOPEE_AUTO_OLD, SHOPEE_AUTO_NEW);
  console.log('4b. Shopee tooltip: OK');
}

// Adicionar textos descritivos abaixo dos botões de automação
// Localizar o bloco principal de automação (botões TikTok / Shopee)
const CTA_BLOCK_OLD = `                className="w-full h-16 flex items-center justify-center gap-3 uppercase font-black text-sm tracking-widest rounded-2xl border-2 transition-all
                  bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 
                  shadow-[0_0_30px_rgba(16,185,129,0.2)]"
               >
                  <Shield size={20} /> POSTAR NA SHOPEE`;

const CTA_BLOCK_NEW = `                className="w-full h-16 flex flex-col items-center justify-center gap-0.5 uppercase font-black text-sm tracking-widest rounded-2xl border-2 transition-all
                  bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 
                  shadow-[0_0_30px_rgba(16,185,129,0.2)]"
               >
                  <div className="flex items-center gap-2"><Shield size={20} /> POSTAR NA SHOPEE</div>
                  <span className="text-[8px] font-normal normal-case text-emerald-400/60 tracking-normal">Copia legenda → abre Shopee Vídeos`;

if (content.includes(CTA_BLOCK_OLD.substring(0, 60))) {
  content = content.replace(CTA_BLOCK_OLD, CTA_BLOCK_NEW);
  console.log('4c. Shopee CTA text: OK');
}

fs.writeFileSync('./src/App.tsx', content, 'utf8');
console.log('TUDO CONCLUIDO!');
