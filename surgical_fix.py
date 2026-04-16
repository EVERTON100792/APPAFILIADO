import os
import re

def surgical_fix():
    file_path = 'src/App.tsx'
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 1. Normalize line endings and whitespace at the binary level
    content = raw.decode('utf-8', errors='ignore')
    content = content.replace('\r', '') # Normalize all line endings to \n
    
    # 2. Fix the dangling string at line 1097-1098
    # Pattern: return "Encontrei o link perfeito na Shopee! ✅";\n Confira na minha bio agora e aproveite o desconto!";
    # We want to merge them.
    bad_block = r'return "Encontrei o link perfeito na Shopee! ✅";\n\s*Confira na minha bio agora e aproveite o desconto!";'
    good_block = 'return "Encontrei o link perfeito na Shopee! ✅ Confira na minha bio agora e aproveite o desconto!";'
    content = re.sub(bad_block, good_block, content)

    # 3. Comprehensive Un-mangle of Portuguese/Emoji characters
    # This covers double and triple mangling cases
    mangles = {
        'Ã§Ã£': 'ção',
        'Ã³': 'ó',
        'Ã¡': 'á',
        'Ã©': 'é',
        'íƒO': 'ÃO',
        'íƒ': 'Ã',
        'í‰': 'É',
        'í‡': 'Ç',
        'íŠ': 'Ê',
        'íš': 'Ú',
        'í¡': 'á',
        'í­': 'í',
        'í³': 'ó',
        'íº': 'ú',
        'âœ': '✅',
        'ðŸ’Ž': '💎',
        'ðŸ› ï¸ ': '🛍️',
        'ðŸš€': '🚀',
        '🚨': '🚨',
        '🔥': '🔥',
        '😱': '😱',
        '😍': '😍',
        '✨': '✨',
    }
    for mangled, fixed in mangles.items():
        content = content.replace(mangled, fixed)

    # 4. Final Polish
    content = content.replace('EDIÇÃOO', 'EDIÇÃO')
    content = content.replace('Proteçãoo', 'Proteção')
    content = content.replace('operaçãoo', 'operação')
    content = content.replace('Automaçãoo', 'Automação')

    # 5. Fix any other stray "Encontrei... Shopee! " patterns that might be broken
    content = re.sub(r'return "Encontrei o link perfeito na Shopee! ✅";', 'return "Encontrei o link perfeito na Shopee! ✅";', content)

    # 6. Ensure only ONE export default
    parts = content.split('export default App;')
    if len(parts) > 1:
        content = parts[0] + 'export default App;'

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Surgical fix applied.")

if __name__ == "__main__":
    surgical_fix()
