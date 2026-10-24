# Ato 4 · O grande roubo · versão 0.5

## Experiência

Após a ativação, o jogador conhece Anderson, o ladrão. A cidade tem vista de cima, cruzamentos, faixas de pedestres, lojas, oficina, cinema, carros e pedestres de ambientação. O personagem anda pela cidade e encontra o Ford Ka azul estacionado na Rua das Oficinas.

WASD/setas movem o personagem; Shift permite correr. No celular, as setas na tela aceitam toque curto ou pressão contínua. Clicar/tocar numa rua calcula um caminho que evita os prédios. O minimapa acompanha Anderson. O Ford Ka é identificado quando está próximo, e E ou “Entrar no Ford Ka” só funciona dentro do alcance.

Dentro do veículo há uma ilustração do painel. O jogador o abre, examina doze cabos e conecta três símbolos aos encaixes correspondentes. A ordem e as cores variam entre partidas. Todos os símbolos são fictícios de um módulo arcade. Examinar um cabo é seguro; conectar um símbolo errado ou tentar dar partida incompleto dispara o alarme.

Na falha, uma viatura chega com sirene e luzes; um policial se aproxima; aparece “ANDERSON FOI PRESO / GAME OVER”. Na partida correta, o motor liga e o jogador dirige o Ka. W/↑ acelera, S/↓ freia e dá ré, A/D ou ←/→ viram. O carro respeita as colisões dos prédios. Sair da tela encerra o ato em “E aí… / FIM DO ATO 4”.

## Implementação

Arquivos: `dist/heist-core.mjs`, `dist/heist-art.mjs`, `dist/heist.mjs`, `dist/heist.css` e `dist/heist.html`. Não há engine 3D nem dependência nova. A cidade e os sprites são desenhados no Canvas 2D; o retrato e o painel são SVG do próprio código. O relógio da simulação é independente das solicitações de pintura do navegador, para não prender as transições de partida e prisão. Página oculta e ajuda pausam a simulação; movimento reduzido desativa animações de ambientação e luzes decorativas.

A campanha recebe o Ato 4 no mesmo caso após a conclusão do Ato 3. Saves antigos de ativação concluída têm uma entrada de continuação para o novo ato. O modo isolado tem identidade e save separados e preserva o expediente da campanha.

## Validação

- 48 testes Node: atos anteriores, mensagens mais frequentes, migração/continuação, isolamento de saves, proximidade para entrar no carro, obstáculos, rotas por clique, doze símbolos, todas as ligações certas e erradas, partida incompleta/completa, chegada da polícia, aceleração/freio/curvas, saída da cena e retomada.
- Desktop: apresentação, caminhada pelas ruas por botões e por teclado mantido pressionado, localização do Ka, entrada, abertura do painel, três ligações corretas, partida, direção e fim do ato.
- Falha: circuito incorreto, alarme, chegada da polícia e diálogo de prisão/game over.
- Celular em largura de 390 px: apresentação, minimapa, controles por toque curto e pressão contínua, clique/toque na rua com caminhada até o destino, chegada ao Ka, painel, ligações, partida, aceleração por toque mantido e conclusão do ato. Nenhuma rolagem horizontal na cidade ou no painel.
- Integração: Ato 3 atualizado percorrido até a entrada no Ato 4, mantendo a campanha e o modo isolado conforme o caso.
- Testes em aparelhos físicos não realizados.

Prévias: `docs/roubo-cidade.jpg`, `docs/roubo-final.jpg` e `docs/cobrancas.jpg`.
