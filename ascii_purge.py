import unicodedata
import os
import re

def ascii_purge():
    file_path = 'src/App.tsx'
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 1. Byte-level fixes for known truncated strings before normalization
    # Merge line 2155-2156
    # Pattern: showToast("Ví DEO BAIXADO COM SUCESSO! âœ\n");
    # We want "VIDEO BAIXADO COM SUCESSO!";
    content = raw.decode('utf-8', errors='ignore')
    content = content.replace('showToast("Ví DEO BAIXADO COM SUCESSO! âœ\n");', 'showToast("VIDEO BAIXADO COM SUCESSO!");')
    content = content.replace('showToast("Ví DEO BAIXADO COM SUCESSO! \n");', 'showToast("VIDEO BAIXADO COM SUCESSO!");')
    
    # 2. Fix the dangling string at 1097-1098
    # return "Encontrei... Shopee! \n Confira na minha bio..."
    content = re.sub(r'return "Encontrei o link perfeito na Shopee! .*?\n\s*Confira na minha bio agora e aproveite o desconto!";', 
                     'return "Encontrei o link perfeito na Shopee! Confira na minha bio agora e aproveite o desconto!";', content)

    # 3. Normalize all characters to ASCII
    def remove_accents(input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

    content = remove_accents(content)
    
    # 4. Remove all non-printable ASCII characters
    content = "".join([c if ord(c) < 128 else "" for c in content])

    # 5. Fix common corrupted words that normalize weirdly
    content = content.replace('EDIí‡íƒO', 'EDICAO')
    content = content.replace('EDIÃ‡ÃƒO', 'EDICAO')
    content = content.replace('EDIÇÃO', 'EDICAO')
    content = content.replace('Edicaoo', 'Edicao')
    content = content.replace('Edicaoo', 'Edicao')
    content = content.replace('Automacaoo', 'Automacao')
    content = content.replace('Protecaoo', 'Protecao')
    
    # 6. Final Polish: Ensure only one export default
    parts = content.split('export default App;')
    if len(parts) > 1:
        content = parts[0] + 'export default App;'

    with open(file_path, 'w', encoding='ascii') as f:
        f.write(content)
    print("ASCII Purge complete.")

if __name__ == "__main__":
    ascii_purge()
