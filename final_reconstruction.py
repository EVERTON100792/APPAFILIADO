import os
import re

def final_reconstruction():
    file_path = 'src/App.tsx'
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 1. Decode and normalize whitespace
    content = raw.decode('utf-8', errors='ignore')
    
    # Remove redundant carriage returns caused by multiple script runs
    content = content.replace('\r', '') # Normalize to \n
    
    # 2. Binary Cleanup of mangled PT-BR characters
    mangles = {
        'Ã§Ã£': 'ção',
        'Ã§': 'ç',
        'Ã£': 'ã',
        'Ã³': 'ó',
        'Ã¡': 'á',
        'Ã©': 'é',
        'íƒO': 'ÃO',
        'íƒ': 'Ã',
        'í‰': 'É',
        'í‡': 'Ç',
        'íŠ': 'Ê',
        'íš': 'Ú',
    }
    for mangled, fixed in mangles.items():
        content = content.replace(mangled, fixed)

    # 3. Surgical Fix for the handleFinalViralize Syntax
    # Since we found a syntax error at line 3293 (esbuild report), let's ensure the whole file is balanced.
    # The esbuild error was: Unexpected token at ].map((item, i) =>
    # This often means a missing closing brace in a previous component or block.
    
    # Let's ensure the handleFinalViralize is clean
    clean_viralize = """  const handleFinalViralize = async (script: ViralScript) => {
    if (!videoData) return;
    setIsProcessing(true);
    try {
      const processor = new VideoProcessor();
      const options = {
        filter: videoData.filter || 'none',
        transition: videoData.transitions?.[0] || 'none',
        transitionList: videoData.transitions || [],
        legend: "",
        isMuted: isMuted,
        viralScript: script,
        musicUrl: selectedMusic || undefined
      };
      
      let blob;
      if (videoData.isAutoral && videoData.images) {
         blob = await processor.renderSlideshow(videoData.images, options as any, `R$ ${selectedProduct?.price || 0}`, selectedProduct?.item_name || "Produto");
      } else {
         blob = await processor.renderVideo(videoData.url, options as any);
      }
      
      const videoObjectUrl = URL.createObjectURL(blob);
      setVideoData({
        ...videoData,
        id: `viralized-${Date.now()}`,
        url: videoObjectUrl,
        isAutoral: true,
        script: script
      });
      setShowAppScriptSelector(false);
      showToast("VÍDEO BLINDADO E AUTORAL! ✅");
    } catch (err) {
      console.error(err);
      showToast("Erro ao processar vídeo autoral.");
    } finally {
      setIsProcessing(false);
    }
  };"""
    
    # Targeted replacement of handleFinalViralize
    content = re.sub(r'const handleFinalViralize = async \(script: ViralScript\) => \{.*?\};', clean_viralize, content, flags=re.DOTALL)

    # 4. Correct the TikTokPublisher and Modal integration
    if '<TikTokPublisher' not in content:
        publisher_code = """<TikTokPublisher 
                      userId={user?.id}
                      videoUrl={videoData?.url}
                      caption={customCopy}
                      isPro={hasAccessToPlatform}
                      productLink={selectedProduct?.affiliate_link || selectedProduct?.item_link}
                      isAutoralVideo={videoData?.isAutoral}
                      onTransformToAutoral={handleTransformToAutoral}
                      onSuccess={() => showToast("PROCESSANDO POSTAGEM...")}
                    />"""
        grid_pattern = r'<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">.*?</div>'
        content = re.sub(grid_pattern, '<div className="mb-6">' + publisher_code + '</div>', content, flags=re.DOTALL)

    # 5. Fix typos
    content = content.replace('EDIÇÃOO', 'EDIÇÃO')
    content = content.replace('Proteçãoo', 'Proteção')
    content = content.replace('operaçãoo', 'operação')
    content = content.replace('Automaçãoo', 'Automação')

    # 6. Ensure only ONE export default and ONE App component
    # We'll take the first one and discard anything following it.
    parts = content.split('export default App;')
    if len(parts) > 1:
        content = parts[0] + 'export default App;'

    # 7. Write as clean UTF-8
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Final reconstruction finish.")

if __name__ == "__main__":
    final_reconstruction()
