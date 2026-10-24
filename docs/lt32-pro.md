# Instalação 2D · LT-32 PRO · versão 0.3

## Fonte

Manual do usuário LT32 PRO fornecido por Luan em PDF, 34 páginas, versão `04-082025`. Foram lidos o texto integral e os diagramas relevantes renderizados. A implementação usa as páginas 8–10:

| Página | Informação aplicada |
| --- | --- |
| 8 | SIM inserido/retirado apenas com equipamento desligado; antena integrada; face sem adesivo voltada para cima; ausência de metal cobrindo o aparelho. |
| 9 | Chicote JST de quatro vias: vermelho VCC de 9–90 V, preto GND, laranja entrada de ignição e amarelo saída negativa; verde/azul do conector de duas vias para SOS. |
| 10 | Diagrama com saída amarela no terminal 86 do relé e terminal 85 positivo; recomendação de fusível de 2 A no VCC. |

O painel proibido é uma regra do roteiro de Luan, identificada na tela como ordem da Cat. Não é apresentado como proibição do fabricante. A ilustração do aparelho é estilizada. Não se inferem cores de cabos reais ou locais universais de instalação a partir do veículo fictício.

## Adaptação

- O Ato 2 da campanha usa exclusivamente SVG/HTML/CSS 2D e recebe cliente e veículo do Ato 1.
- O LCV5 3D permanece na entrada “Praticar na oficina 3D”, com seu funcionamento anterior.
- Cinco pontos do veículo são clicáveis, com botões de texto equivalentes. Dois acabamentos laterais plásticos são aprovados neste cenário; painel, motor e piso exposto falham.
- Doze cabos variam letras, cores e percurso a cada partida. Quatro têm funções corretas. O multímetro fictício apresenta tensão com chave ligada/desligada e descrição funcional.
- A ligação é avaliada ao clicar no destino ou soltar o arraste sobre ele. A escolha de um cabo para inspeção não causa falha.
- Ocultação exige face sem adesivo para cima, montagem fixada/isolada e o ponto originalmente escolhido.
- Acabamento deve ser recolocado antes de fechar as peças externas. Entregar incompleto causa falha.
- Uma falha em qualquer etapa dispara explosão SVG com som procedural, depois o retrato da Cat e a frase “MEU DEUS...! ESTÁ DEMITIDO”. Há botão para voltar e retorno automático em 12 segundos.
- Preferências de som/movimento reduzido são respeitadas. O modo isolado não apaga o save de campanha.

## Validação de 24/10/2026

- 24 testes Node aprovados, incluindo todas as combinações de cabo/destino, locais, orientação/fixação, fechamento, retomada e integração com campanha/prática.
- Navegador desktop: início pelo menu, clique no painel sobre o carro, explosão visível e diálogo exato de demissão; novo início e percurso completo correto até o Ato 2 concluído.
- Foram conferidas as quatro leituras dos cabos e suas conexões, orientação da antena, fixação, ocultação, reposição do acabamento e fechamento das três peças externas.
- Arraste de uma ponta do emaranhado até o fio vermelho validado no navegador, seguido da conclusão com os controles de clique.
- Layout de 390 px: seleção do local, leitura de cabo, ligação errada e diálogo da Cat verificados; nenhuma rolagem horizontal. A falha retorna a rolagem ao topo para exibir a explosão.
- Verificação em aparelhos físicos pendente.

As prévias de interface ficam em `docs/lt32-2d.jpg` e `docs/lt32-demissao.jpg`.

## Atualização 0.4

A nomenclatura foi explicitada: “Negativo da bateria” substitui “Massa”; os outros circuitos também recebem nomes completos. Foram adicionados farol baixo, luz de freio, buzina e desembaçador traseiro, totalizando doze fios. O Ato 2 oferece continuar para testes e ativação, e preserva o ponto escolhido para a imagem enviada pelo técnico no WhatsApp. Saves anteriores de oito fios são migrados por função.
