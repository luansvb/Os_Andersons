# Expressões de Cat, Bear e Rô — versão 1.1

Os três atlas foram criados com a ferramenta integrada de geração de imagens, usando os retratos existentes no jogo como referência. Cada imagem tem uma grade 2 × 2: observando, desconfiando, sem paciência e aprovando. Bear permanece careca. A identidade dos personagens foi preservada e os quadros foram inspecionados visualmente.

Os PNGs originais ficam em `docs/art-source/`. O jogo carrega somente as cópias WebP em `dist/assets/`, com 443.138 bytes no total. A conversão de formato usou ImageMagick, qualidade 85, sem alterar a disposição dos quadros. O CSS seleciona cada expressão pela posição do fundo.

## Cat

Original: `docs/art-source/cat-expressions.png`.

Recurso publicado: `dist/assets/cat-expressions.webp`.

Prompt utilizado:

```text
Use case: identity-preserve. Asset type: one square 2-by-2 facial expression atlas for the existing 2D game OS ANDERSONS. The input image is the identity reference/edit target for Cat: the blonde feline woman, pale eyes, red lipstick, cat whiskers and large cat ears. Create four consistent head-and-short-neck portraits of THIS SAME character in the same warm clean illustrated style, with identical front-facing camera, head scale, color, facial features and accessories. Exact 2x2 equal quadrants, each portrait centered within its quadrant; keep every ear and the entire head inside its own cell with generous breathing room. Top left: calm attentive, mouth gently neutral. Top right: suspicious, one eyebrow raised, narrowing eyes. Bottom left: visibly irritated and shouting, furrowed brows, open mouth, comedic boss anger. Bottom right: pleased, warmly smiling and proud. Expressions must be unmistakably distinct but identity must remain identical in all four portraits. Uniform solid dark teal #17232b background throughout, no panel borders, no labels, no text, no typography, no icons, no props, no watermark. Equal framing and exact quadrant alignment are essential because the game will display individual quadrants with CSS backgrounds.
```

## Bear

Original: `docs/art-source/bear-expressions.png`.

Recurso publicado: `dist/assets/bear-expressions.webp`.

Prompt utilizado:

```text
Use case: identity-preserve. Asset type: one square 2-by-2 facial expression atlas for the existing 2D game OS ANDERSONS. The input image is the identity reference/edit target for Bear: the brown bear with a bald smooth crown, round ears, large dark nose and brown eyes. Keep him bald; no human hair or tuft. Create four consistent head-and-short-neck portraits of THIS SAME character in the same warm clean illustrated style, with identical front-facing camera, head scale, color, facial features and accessories. Exact 2x2 equal quadrants, each portrait centered within its quadrant; keep every ear and the entire head inside its own cell with generous breathing room. Top left: calm attentive, mouth gently neutral. Top right: suspicious, one eyebrow raised, narrowing eyes. Bottom left: visibly irritated and shouting, furrowed brows, open mouth, comedic boss anger. Bottom right: pleased, warmly smiling and proud. Expressions must be unmistakably distinct but identity must remain identical in all four portraits. Uniform solid dark teal #17232b background throughout, no panel borders, no labels, no text, no typography, no icons, no props, no watermark. Equal framing and exact quadrant alignment are essential because the game will display individual quadrants with CSS backgrounds.
```

## Rô

Original: `docs/art-source/ro-expressions.png`.

Recurso publicado: `dist/assets/ro-expressions.webp`.

Prompt utilizado:

```text
Use case: identity-preserve. Asset type: one square 2-by-2 facial expression atlas for the existing 2D game OS ANDERSONS. The input image is the identity reference/edit target for Rô: the orange fox woman with oversized black glasses and the exact dark facial tattoos and ear shapes from the reference. Create four consistent head-and-short-neck portraits of THIS SAME character in the same warm clean illustrated style, with identical front-facing camera, head scale, color, facial features and accessories. Exact 2x2 equal quadrants, each portrait centered within its quadrant; keep every ear and the entire head inside its own cell with generous breathing room. Top left: calm attentive, mouth gently neutral. Top right: suspicious, one eyebrow raised, narrowing eyes. Bottom left: visibly irritated and shouting, furrowed brows, open mouth, comedic boss anger. Bottom right: pleased, warmly smiling and proud. Expressions must be unmistakably distinct but identity must remain identical in all four portraits. Uniform solid dark teal #17232b background throughout, no panel borders, no labels, no text, no typography, no icons, no props, no watermark. Equal framing and exact quadrant alignment are essential because the game will display individual quadrants with CSS backgrounds.
```

