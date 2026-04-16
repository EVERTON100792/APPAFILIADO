import os

def apply_final_surgery():
    file_path = 'src/App.tsx'
    with open(file_path, 'r', encoding='ascii') as f:
        content = f.read()

    # 1. Surgical fix for the handleFinalViralize break
    # We found a premature }; at pos 86133
    # The corrupted block looks like:
    # } finally {
    #   setIsProcessing(false);
    # }
    # };
    #
    # let blob;
    # if (videoData.isAutoral && videoData.images) {
    
    # We will search for this pattern and fix the logic
    target_pattern = """    } finally {
      setIsProcessing(false);
    }
  };

      

      let blob;"""
    
    if target_pattern in content:
        # If this is found, it means the function was closed, and then the logic continued outside.
        # We need to REMOVE the closure and let the logic be inside the 'try' block.
        # But wait, looking at my previous view_file, it seems the WHOLE function was duplicated but broken.
        
        # Let's use a simpler approach: replace the whole handleFinalViralize block again with a 100% CLEAN version
        # to ensure no dangling characters.
        pass

    # Safe Reconstruction of handleFinalViralize
    # Find the start
    start_str = 'const handleFinalViralize = async (script: ViralScript) => {'
    start_index = content.find(start_str)
    
    if start_index != -1:
        # Find the next 'const handleDownload' which follows it
        end_str = 'const handleDownload ='
        end_index = content.find(end_str, start_index)
        
        if end_index != -1:
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
      showToast("VIDEO BLINDADO E AUTORAL! OK");
    } catch (err) {
      console.error(err);
      showToast("Erro ao processar video autoral.");
    } finally {
      setIsProcessing(false);
    }
  };

  """
            content = content[:start_index] + clean_func + content[end_index:]

    # 2. Final check for string balance at line 1097-1098
    content = content.replace('Encontrei o link perfeito na Shopee! OK";\n Confira na minha bio agora e aproveite o desconto!";', 'Encontrei o link perfeito na Shopee! OK Confira na minha bio agora e aproveite o desconto!";')

    # 3. Save as clean ASCII/UTF-8
    with open(file_path, 'w', encoding='ascii') as f:
        f.write(content)
    print("Final surgery finished.")

if __name__ == "__main__":
    apply_final_surgery()
