"""Extract only user-supplied visual assets, not simulated application logic."""
import re
from pathlib import Path
p=Path('references/prototype_mobile_16_ecrans.html').read_text(encoding='utf-8')
start=p.index('function bot(){return `')+len('function bot(){return `')
end=p.index('`}',start)
Path('public/mascot.svg').write_text(p[start:end],encoding='utf-8')
css=re.search(r'<style>([\s\S]*?)</style>',p).group(1)
css=css[css.index('.content{'):css.index('.toast{')]
Path('src/app/prototype.css').write_text('/* Visual styles adapted from the supplied prototype. */\n'+css,encoding='utf-8')
