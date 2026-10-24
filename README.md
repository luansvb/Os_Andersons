# OS ANDERSONS — INSTALANDO E ROUBANDO

🎮 **[Jogar on-line no PC ou celular](https://luansvb.github.io/Os_Andersons/)**

Código-fonte do jogo completo, com os cinco atos, imagens, testes e oficina 3D de prática.

Versão 1.2.0. Campanha individual completa de navegador. Ato 1: Agendamento. Ato 2: Instalação 2D do LT-32 PRO. Ato 3: Testes e ativação com Cat e Bear. Ato 4: O grande roubo, com Anderson, o ladrão. Ato 5: Atuação anti furto com Rô, atendimento, rastreamento e perseguição final. O simulador LCV5 continua disponível separadamente para prática em 3D.

## Segunda parte: diagnóstico na ativação — versão 1.2.0

A primeira posição pode revelar um vínculo de IMEI divergente, uma perda de alimentação depois do teste inicial ou falta de recepção GNSS no ambiente do teste. Também existem casos sem falha. O cenário varia por atendimento e permanece estável ao retomar o save.

O jogador consulta Cadastro, Laudo e Telemetria, escolhe uma das quatro condutas embaralhadas e aguarda a confirmação. Nas falhas, precisa pedir uma nova posição depois da correção. No caso saudável, aguardar preserva o tempo já decorrido. O perfil Estagiário mostra uma dica adicional; uma conduta errada continua causando demissão com motivo específico e checkpoint nos perfis que o permitem.

Saves de ativação das versões anteriores mantêm a espera original, sem falhas novas inseridas no meio da partida. Inicie outro atendimento para experimentar os diagnósticos. Regras, migração e verificação em [docs/diagnostico-ativacao.md](docs/diagnostico-ativacao.md).

## Melhoria por partes: escolhas de atendimento — versão 1.1.2

Primeira entrega da sequência de melhorias: alternativas mais convincentes. As duas decisões iniciais, as três perguntas do cadastro e o atendimento anti furto agora misturam respostas profissionais com erros de procedimento e uma alternativa de humor. Os textos têm comprimentos próximos; o tamanho da resposta deixa de destacar a correta.

Cada decisão mostra uma orientação do setor antes das alternativas. Erros incluem confirmar uma agenda antes de ouvir o cliente, liberar acesso antes dos testes, prometer bloqueio automático, preencher só parte dos dados e reaproveitar outro atendimento. Uma coincidência no nome, modelo ou horário não torna correto presumir esses dados.

A demissão explica o erro da alternativa escolhida. Essa explicação e o embaralhamento continuam compatíveis com os checkpoints. As conferências da ativação também explicam o dado divergente; o cadastro duplicado mostra três IMEIs com o mesmo tipo de rótulo, exigindo comparar os números com a etiqueta.

A atualização mantém os mesmos estados e índices internos das respostas, preservando os saves. Novos problemas de diagnóstico na ativação ficam para a próxima parte. Validação: build estático e 96 testes automatizados, incluindo orientação, motivo de demissão e retomada da mesma pergunta.

## Alternativas embaralhadas — versão 1.1.1

As respostas do agendamento e do atendimento anti furto, datas/horários, classificação, conferências de ativação, comandos e contatos variam de ordem a cada novo expediente. Os botões de procedimento e o puzzle arcade continuam variando por partida e etapa.

Na instalação, variam os locais e suas letras, as origens do emaranhado, as pontas dos cabos, os quatro terminais do LT-32 PRO e os botões de fechamento. A tabela de referência, o desenho e os botões usam o mesmo mapeamento. Cores, funções e pontos físicos corretos não mudam.

Cada etapa mantém sua disposição ao medir um fio, trocar de aba, receber uma cobrança, recarregar ou retomar um checkpoint. A validação usa a identidade da resposta, nunca sua posição visual. Os atalhos numéricos seguem os números mostrados na tela. O embaralhamento é local, sem servidor ou alteração no formato dos saves. Os testes verificam a variação das posições corretas entre partidas, os atalhos visuais, as cinco conferências de ativação, a concordância entre desenho e botões dos fios e a preservação das ligações após retomar.

## Novidades da versão 1.1

- Três dificuldades: Estagiário, Efetivado e Contrato de experiência. As duas primeiras oferecem checkpoints; a última preserva a regra de perder a campanha ao errar.
- A instalação acompanha o Ford Ka pelos atos seguintes: esconderijo, organização e antena mudam o diálogo, o tempo de GPS e a janela do bloqueio.
- Medidor de paciência, falas reativas, expressões de Cat, Bear e Rô e trilha original procedural com controle de som.
- Clientes com horários diferentes, mensagens fragmentadas, correções e respostas em áudio com transcrição. A voz usa a síntese do navegador quando disponível.
- Cinco conferências de dados dentro das 20 etapas da ativação: modelo, veículo, dois testes e cadastro duplicado.
- Cidade com detalhes cômicos, obras e ambientação; perseguição com avisos de aproximação e controles para os dois polegares.
- Relatório por ato, notas, tempo, erros, retomadas, colisões, conquistas permanentes e finais conforme o desempenho, incluindo uma cena extra.

Os recordes e conquistas ficam neste navegador, sem conta ou sincronização. Para experimentar todas as variações e escolher a dificuldade, comece um novo expediente. Veja as regras e a validação em [docs/atualizacao-1-1.md](docs/atualizacao-1-1.md).

## Executar e validar

```sh
npm ci
npm run build
npm test
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080`. `dist/` é a raiz estática para publicação. Não é necessário servidor de partidas, cadastro ou banco de dados. A campanha 2D usa HTML, CSS, SVG e Canvas 2D, sem WebGL. O build atualiza os estilos de compatibilidade para celular e empacota a oficina 3D preservada, incluindo engine e fotografias locais. Fontes usam Google Fonts com fallbacks do sistema.

## Fluxo da campanha

1. Cliente digita por três segundos e a Cat apresenta as decisões do atendimento.
2. Escolha a apresentação profissional e a explicação completa do rastreador. A posição das respostas varia por partida.
3. Seis técnicos e o cliente percorrem o mapa. A seleção considera a distância no instante do clique, aceitando empates exatos.
4. Cadastro: pergunte nome completo, marca/modelo e disponibilidade. As alternativas são embaralhadas; copie e cole as respostas na ficha.
5. Confirmação: amanhã, às 10h, 12h ou 14h, conforme a última mensagem do cliente, a partir do início da partida em America/Sao_Paulo.
6. A conclusão do Ato 1 oferece continuar com o mesmo cliente e veículo para a instalação do LT-32 PRO.
7. O carro aparece aberto em uma ilustração 2D. O jogador escolhe um local discreto; o painel está expressamente proibido pela Cat.
8. Doze cabos embaralhados formam um emaranhado. O jogador traça ou examina os cabos e conecta quatro funções ao chicote do rastreador, por cliques/toques ou arraste.
9. O jogador vira o aparelho, fixa e isola a montagem e o esconde no ponto preparado.
10. Recoloca o acabamento, fecha capô, porta e porta-malas e confere a instalação física. A instalação física é aprovada e oferece continuar para a ativação.
11. No WhatsApp, o técnico envia imagens da etiqueta e do ponto escolhido. O jogador digita o IMEI de 15 dígitos.
12. Bear assume a supervisão de 20 telas com posições e botões diferentes. A ordem atual indica a ação a executar; outras funções causam demissão.
13. Na plataforma, o jogador solicita a posição. Uma inconsistência abre o diagnóstico: comparar três fontes, escolher a conduta, aguardar a confirmação e solicitar uma nova posição. Sem falha, basta aguardar a aquisição normal. O técnico e Bear continuam cobrando agilidade.
14. A localização deve ser copiada da plataforma e enviada ao contato do técnico. Após seis telas de liberação de acesso, o login e a senha devem ser copiados e enviados ao cliente.
15. Técnico e cliente agradecem, Cat e Bear elogiam, e o veículo se move sozinho no mapa sob a mensagem “INSTALAÇÃO CONCLUÍDA COM SUCESSO”.
16. O jogador segue para O grande roubo. Anderson, o ladrão, é apresentado em uma cidade vista de cima.
17. Caminha com WASD, setas, controles de toque ou clicando na rua até encontrar o Ford Ka azul.
18. Perto do carro, usa E ou o botão para entrar. Na vista interna, abre o painel e conecta os símbolos de três encaixes do módulo arcade.
19. Uma ligação errada dispara o alarme; uma viatura chega e Anderson é preso, dando game over.
20. Três circuitos corretos permitem ligar o motor e dirigir na direção das setas da tela, com freio separado e Turbo opcional até sair da tela. O ato termina com “E aí…” e permite continuar para a atuação anti furto.

21. Um alerta “FUI ROUBADO” inicia o atendimento. A resposta que acolhe o cliente e pergunta como aconteceu prossegue.
22. O relato do cliente pede a classificação furto. Escolher roubo exige acompanhar 28 páginas da bronca da Rô, sem demissão, antes de voltar à pergunta.
23. O jogador abre o rastreamento, copia a localização do Ka em movimento e a envia para Pronta resposta.
24. Assume a viatura e acompanha o Ford Ka pela cidade. Na dificuldade Efetivado, a aproximação precisa ficar estável por 2,2 segundos antes de abrir uma janela de 1,5 segundo para enviar BLOQUEAR. A conferência da antena no Ato 2 pode acrescentar 0,35 segundo.
25. Bloqueio correto recupera o veículo. Antecipação, atraso ou fim do prazo de 70 segundos dão game over. A Rô permanece visível guiando a operação.

Uma ação incorreta de instalação causa uma explosão desenhada, seguida da Cat dizendo “MEU DEUS...! ESTÁ DEMITIDO”. Nos modos Estagiário e Efetivado, o jogador pode retomar o checkpoint. Contrato de experiência encerra a campanha após uma falha. Examinar cabos e alternar os preparativos de ocultação não são erros; a avaliação ocorre ao conectar, esconder, fechar ou entregar.

O menu também oferece instalação 2D isolada, ativação isolada, O grande roubo isolado, Atuação anti furto isolada e prática 3D do LCV5. Essas opções preservam o save da campanha. Saves concluídos do Ato 1 em versões anteriores podem continuar diretamente para o novo Ato 2. A prática 3D mantém sua recepção, acessórios, chicotes, possibilidade de reparo e teste de rua.

## Estrutura

- `dist/career-core.mjs`, `dist/shift-session.mjs`, `dist/shift.css`: dificuldades, checkpoints, métricas, chefia, expressões, áudio, conquistas e avaliação.
- `dist/activation-checks.mjs`: as cinco conferências de dados.
- `dist/city-details.mjs`: obras e detalhes da cidade.
- `dist/core.mjs`: roteiro e regras do Ato 1.
- `dist/app.mjs`: campanha, menus, cliente, saves e integração dos minigames.
- `dist/lt32-core.mjs`: regras, cabos por partida e retomada da instalação 2D.
- `dist/lt32-car.mjs`: ilustrações SVG do carro, rastreador e explosão.
- `dist/lt32.mjs`, `dist/lt32.css`, `dist/lt32.html`: interface 2D, controles e som.
- `dist/activation-diagnosis.mjs`: cenários, evidências, condutas e estado do diagnóstico simulado.
- `dist/activation-core.mjs`: sequência, IMEI por partida, comandos, espera, destinatários e retomada do Ato 3.
- `dist/activation.mjs`, `dist/activation.css`, `dist/activation.html`: telas da ativação, WhatsApp, Bear, notificações e encerramento.
- `dist/activation-visuals.mjs`: etiqueta com números exatos, imagem da instalação e mapa animado.
- `dist/heist-core.mjs`: cidade, colisões, caminhada, caminhos por clique, puzzle arcade, prisão, direção, saída de cena e saves do Ato 4.
- `dist/heist-art.mjs`: cidade e sprites em Canvas 2D; retrato, painel e emaranhado em SVG.
- `dist/heist.mjs`, `dist/heist.css`, `dist/heist.html`: interface, controles, relógio do jogo, sirene e encerramento.
- `dist/recovery-core.mjs`, `dist/ro-lecture.mjs`: regras e capacitação da Rô no Ato 5.
- `dist/recovery.mjs`, `dist/recovery-art.mjs`, `dist/recovery.css`, `dist/recovery.html`: atendimento, rastreamento, corrida e controles do desafio final.
- `docs/atuacao-anti-furto.md`: conceitos, fontes oficiais, dificuldade, estados e verificação do Ato 5.
- `dist/styles.css`: identidade visual principal.
- `dist/workshop-theme.css`: apresentação da prática 3D.
- `workshop/lcv5/`: simulador copiado e adaptado do LCV5; ver `ORIGIN.md`.
- `scripts/build-workshop.mjs`: empacota o simulador em `dist/workshop.html`.
- `tests/`: roteiro, integração, LT-32 PRO e regressão do simulador 3D.
- `docs/lt32-pro.md`: referências do manual e decisões de adaptação.

## Estado e integração

A campanha, a instalação 2D e a prática 3D usam saves locais separados. O LT-32 PRO preserva etapa, posição, ligações, orientação, fixação e peças abertas. As letras e cores dos cabos do veículo são estáveis dentro da partida e variam entre partidas; a identidade do cliente impede recuperar outra montagem.

Os minigames usam frames da mesma origem. A troca de mensagens valida origem e janela emissora. Erros permitem retomar a etapa nos perfis Estagiário e Efetivado; Contrato de experiência apaga o progresso da campanha. Erros no modo 2D isolado preservam a campanha. Não há dependência de login do LCV5, Firebase, DMP, WhatsApp, Ciasat ou equipamento físico. Os dados do cliente e o veículo do jogo são fictícios. Não há sincronização entre aparelhos.

## Referência do LT-32 PRO

O manual fornecido por Luan, versão 04-082025, páginas 8–10, fundamenta o chicote de quatro vias e a orientação do aparelho: vermelho positivo 9–90 VCC; preto GND; laranja entrada de ignição; amarelo saída negativa, ligada ao terminal 86 do relé do cenário. O terminal 85 já recebe positivo. A face sem adesivo fica voltada para cima, sem cobertura metálica. O SIM já está inserido com o aparelho desligado e o circuito positivo tem fusível de 2 A. O conector verde/azul do SOS não participa da missão.

A proibição do painel é uma regra de roteiro solicitada pelo autor e aparece como ordem da Cat. Os pontos aprovados, o veículo, os sinais medidos e o emaranhado são uma simplificação fictícia para o jogo. A explosão é um efeito cômico da falha.

## Verificação

103 testes automatizados cobrem roteiro, datas, proximidade, compatibilidade com saves antigos, isolamento dos modos, validação de mensagens, locais permitidos, todas as combinações de ligação do LT-32 PRO, ocultação, sequência de fechamento, entrega, retomada IMEI, 20 validações, comandos, espera por GPS, contatos e conteúdo das mensagens, liberação de acesso, movimento automático regras de movimento/colisão/caminhos, partida arcade, prisão, direção, saída de cena, compatibilidade do Ato 3 concluído com o Ato 4 a capacitação de 28 páginas, localização atualizada, perseguição final, bloqueios, prazo e regressões da oficina LCV5.

Validação visual da versão 0.5: carro 2D, escolha do painel com explosão e fala da Cat; instalação completa por controles até a confirmação de entrega. O Ato 3 foi percorrido até a conclusão, incluindo os envios aos contatos corretos e o movimento automático. O Ato 4 também foi concluído por teclado e por controles de toque, e a ligação errada foi testada até a prisão. Os registros em `docs/lt32-pro.md`, `docs/ativacao.md` e `docs/grande-roubo.md` detalham as verificações. Testes em aparelhos físicos não foram realizados.

## Recursos visuais

Cat, Bear e Rô têm quatro expressões derivadas dos retratos de Luan. Os atlas publicados usam WebP e os originais ficam em `docs/art-source/`; prompts e caminhos em `docs/expressoes-personagens.md`. Bear foi editado a partir do retrato fornecido para remover o tufo no topo da cabeça e deixá-lo careca; arte, prompt e validação em `docs/ativacao.md`. O logo inicial foi gerado para o projeto com a ferramenta integrada de imagens. O carro, o LT-32 PRO estilizado, o emaranhado e a explosão 2D são SVGs do próprio código. A instalação mantém a paleta escura, creme e amarela da campanha.

## Ativação e dados fictícios

O Ato 3 é inteiramente local. IMEI, S/N, ICCID, login, senha, localização e plataforma são dados fictícios da partida. Não há conexão com rastreadores, contatos reais ou serviços de monitoramento. O cronômetro, Bear e as notificações criam pressão; não existe derrota apenas por demora. Enquanto a página estiver oculta ou um guia/foto estiver aberto, a simulação pausa.

A área de transferência interna permite copiar e colar as mensagens em navegadores sem permissão de clipboard. A etiqueta é SVG com números precisos e pode ser ampliada. No IMEI, colagem e drop são bloqueados para preservar a digitação manual. O Ato 2 migra saves antigos de oito fios para os doze novos circuitos sem perder ligações já corretas.

## O grande roubo e cobranças

Na versão 0.5, as cobranças do técnico chegam a cada 3,5 segundos, com uma faixa fixa que permanece visível ao rolar, contador, texto maior e pulsação de borda. Bear também aparece na faixa. Movimento reduzido mantém o destaque sem pulsação.

O Ato 4 usa uma cidade original em Canvas 2D, com construções, pedestres e carros de ambientação. O personagem e o veículo colidem com prédios. O clique/toque em uma rua calcula um caminho acessível, e o jogador pode interrompê-lo com os controles manuais. A câmera acompanha a caminhada e mantém a cena da fuga; o carro precisa sair desse enquadramento para concluir. O puzzle usa símbolos inteiramente fictícios de um módulo arcade.

Os saves do Ato 3 já concluído continuam para o Ato 4. A campanha guarda posição do personagem e do carro, etapa, ligações e enquadramento da fuga. A prisão permite retomar o checkpoint nos dois primeiros perfis e encerra a campanha no Contrato de experiência; no modo isolado, o save da campanha continua preservado. A simulação pausa com a página oculta ou os controles/ajuda abertos. Não houve alteração no simulador 3D de prática.


## Atuação anti furto

Na versão 0.6, o Ato 4 continua diretamente para a missão final, inclusive com saves antigos concluídos. A explicação de furto e roubo foi conferida no glossário jurídico do Senado; os links ficam disponíveis na capacitação. A Rô usa o retrato original enviado pelo autor. Sua bronca tem 28 páginas e cerca de 2.700 palavras, com avanço individual e tempo mínimo por página.

A corrida mantém rosto e instrução da Rô, minimapa do rastreamento e comandos acessíveis. O jogador precisa alcançar o Ka, alinhar e ajustar velocidade. O bloqueio ocorre somente após aviso visual e sonoro, dentro da janela de 1,5 segundo. Ajuda, perda de foco e troca de aba pausam a ação. A vitória para o alvo e confirma a recuperação. O modo isolado e a repetição após vitória preservam a campanha.

Verificação do Ato 5: atendimento correto e demissão, trava da bronca, localização copiada/colada, correção de destinatário, direção com aceleração/freio/curvas, bloqueio antecipado com derrota e bloqueio correto até a recuperação concluída no navegador. O texto completo e os demais limites são verificados por testes automatizados. Os detalhes estão em `docs/atuacao-anti-furto.md`.


## Fechamento da versão 1.0

O expediente termina após a recuperação do Ford Ka, com créditos, elogios de Cat, Bear e Rô e o nome de Luan no roteiro e criação. A campanha concluída recebe um registro no menu e permite rever o encerramento sem reiniciar o progresso. Uma vitória no Ato 5 isolado é apresentada como missão cumprida, sem afirmar que os cinco atos foram jogados.

Os créditos gerais também podem ser abertos e fechados pelo menu. A versão final inclui descrição e metadados de compartilhamento. O jogo segue sem novas dependências ou serviços externos de partidas. A verificação da versão 1.0 cobre os 70 casos automatizados, os créditos no navegador e o layout de 390 pixels. Veja `docs/versao-1.md`.


## Controles dos carros — versão 1.0.1

Nos atos 4 e 5, as setas e WASD movem o carro na direção da tela: ↑/W sobe, ↓/S desce, ←/A vai à esquerda e →/D vai à direita. O veículo se orienta sozinho. Soltar uma direção mantida para o carro; toques curtos têm uma continuação breve para serem perceptíveis. Espaço ou FREIO param sem engatar ré. Shift ou o botão Turbo aumentam a velocidade. Na perseguição, desligue o Turbo ao se aproximar do Ka.

O controle é compartilhado pelos dois atos. Diagonais não ficam mais rápidas, entradas opostas se anulam e os toques são processados pelo relógio normal, sem acelerar artificialmente o prazo da missão. No navegador foram verificadas as quatro setas no Ka e WASD na viatura. Também foram conferidos os toques para cima, baixo e esquerda em 390 pixels. Testes verificam as quatro direções com diferentes orientações iniciais, diagonais, parada, freio, Turbo, colisões e uma perseguição vencida desde a largada com os novos controles.

Detalhes em `docs/controles-direcao.md`.


## Celular e GitHub Pages — versão 1.0.2

O atendimento fica em uma coluna, com respostas em 15 px, botões de pelo menos 56 px e a conversa compacta. Foram retirados elementos decorativos da conversa no celular para deixar a mensagem do cliente e as respostas mais próximas. Os campos usam 16 px para facilitar o preenchimento.

Os arquivos `dist/phone-*.css` são gerados por `npm run build:mobile` a partir dos estilos de cada ato. Eles preservam o layout de celular quando um navegador de toque em retrato usa um viewport largo e reduz a página inteira. Essa compatibilidade só entra em telas largas, sem hover, com ponteiro de toque e proporção vertical; o desktop continua usando os estilos normais. As câmeras dos atos 4 e 5 usam a largura visual correspondente ao layout do celular.

Publicação: GitHub Pages usa a branch `gh-pages`, pasta `/ (root)`. O conteúdo de `dist/` é publicado na raiz dessa branch, com `.nojekyll`. A branch `main` guarda os fontes e os arquivos finais. Ao atualizar o jogo, atualize também a branch de publicação.

Validação: 76 testes automatizados aprovados; atendimento e avanço para o mapa conferidos no navegador em 390 px; interfaces dos atos 4 e 5 conferidas em 360 px sem rolagem horizontal; layout largo de 980 px reduzido para 390 px conferido com a regra de compatibilidade ativada em uma página temporária de QA. Essa simulação não substitui um teste em um aparelho físico.

Prévia do layout: [celular-v1-0-2.jpg](docs/celular-v1-0-2.jpg).
