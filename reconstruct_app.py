import os
import re

def reconstruct_app():
    file_path = 'src/App.tsx'
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 1. Binary Cleanup of Portuguese characters
    mangles = {
        b'\xc3\x83\xc2\xa7\xc3\x83\xc2\xa3': 'ção'.encode('utf-8'),
        b'\xc3\x83\xc2\xa7': 'ç'.encode('utf-8'),
        b'\xc3\x83\xc2\xa3': 'ã'.encode('utf-8'),
        b'\xc3\x83\xc2\xb3': 'ó'.encode('utf-8'),
        b'\xc3\x83\xc2\xa1': 'á'.encode('utf-8'),
        b'\xc3\x83\xc2\xa9': 'é'.encode('utf-8'),
    }
    for mangled, fixed in mangles.items():
        raw = raw.replace(mangled, fixed)

    # Decode safely
    try:
        content = raw.decode('utf-8')
    except UnicodeDecodeError:
        content = raw.decode('utf-8', 'ignore')

    # 2. Fix the specific handleFinalViralize syntax error
    # We will replace the entire function handleFinalViralize with a clean version
    # Search for the function start
    func_start_pattern = r'const handleFinalViralize = async \(script: ViralScript\) => \{'
    func_end_pattern = r'showToast\("VÍDEO BLINDADO E AUTORAL! ✅"\);\s*\} catch \(err\) \{'
    
    clean_func = """const handleFinalViralize = async (script: ViralScript) => {
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

    # We use a bit more robust search to replace the function
    # Find start of handleFinalViralize
    start_pos = content.find('const handleFinalViralize = async (script: ViralScript) => {')
    if start_pos != -1:
        # Find end of the catch block
        end_search = content.find('setIsProcessing(false);', start_pos)
        end_pos = content.find('};', end_search) + 2
        content = content[:start_pos] + clean_func + content[end_pos:]

    # 3. Ensure TikTokPublisher is there
    if '<TikTokPublisher' not in content:
        # Re-inject publisher if missing
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
        grid_pattern = '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
        content = content.replace(grid_pattern, '<div className="mb-6">' + publisher_code + '</div>' + grid_pattern.replace('flex', 'hidden'), 1)

    # 4. Final Polish
    content = content.replace('EDIÇÃOO', 'EDIÇÃO')
    
    # Remove any stray "return "Encontrei... Shopee! " broken lines
    content = re.sub(r'return "Encontrei o link perfeito na Shopee! .*?;', 'return "Encontrei o link perfeito na Shopee! ✅";', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Full reconstruction applied.")

if __name__ == "__main__":
    reconstruct_app()
