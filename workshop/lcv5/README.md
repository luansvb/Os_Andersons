# O instalador · jogo de telemetria

Abre em `/?lab=3d`, com o acesso existente do site. O manual permanece separado. A oficina tem câmera livre, vistas do rastreador, painel aberto e pontas dos chicotes, com estética de jogo. O botão Tela cheia amplia a oficina, mantém os controles de ligação e sincroniza a saída pelo botão ou Esc.

## Desafios

`challenge.js` define seis missões: alimentação/pós-chave, relé de bloqueio, buzzer, sensor AIN3, CAN1 e instalação completa. O usuário segue a indicação do serviço e monta o circuito antes de testar. As ligações são provisórias; a interface não confirma acerto antecipadamente. A partida avalia os fios, os canais exigidos e os chicotes. Ligação incorreta aciona a explosão de jogo; falta de ligação impede a partida sem declarar sucesso. Reparar limpa a tentativa e restaura o veículo. A explosão é um efeito lúdico e não modela consequências elétricas reais.

## Cena e interação

`game.js` controla seleção, arraste, encaixe de 14/16 pinos e a opção explícita de usar os dois chicotes juntos. As pontas têm maior espaçamento, espessura e área de seleção. Sua disposição na mesa é didática, sem indicar a posição das cavidades. `vehicle.js` desenha o veículo estilizado, painel aberto, volante, instrumentos, cabos e animação de explosão/reparo. Three.js e OrbitControls oferecem rotação, zoom e movimento lateral. `interaction.js` mantém seleção e encaixe em pixels de tela, ajusta a sensibilidade entre 50% e 200% e permite zoom com roda ou Alt + movimento vertical enquanto uma ponta está capturada. Levar a ponta às bordas afasta a câmera e move a visão, sem soltar o cabo; isso pode ser desativado. Esc, cancelamento do ponteiro ou perda de foco cancelam o arraste sem criar ligação. Legendas sobre pontas e corpos dos fios mostram pino, cor e função, incluindo cabos do veículo.

## Tela de sensores

`telemetry.js` reproduz os grupos de informação da referência da Ciasat: localização, veículo, IMEI/ICCID/telefone, ignição, baterias, movimento, velocidade, GPS, hodômetro, combustível, consumo, RPM e alertas. Identificadores são fictícios e a interface é marcada como simulação. A tela abre após o acerto e permite variar chave, velocidade, combustível, GPS e saídas. RPM e consumo exigem o par CAN; combustível exige sinal analógico ou CAN. A curva 0–5 V para 0–100% é exclusiva do jogo. Não há conexão com a Ciasat ou com hardware.

## Build e validação

`template.html` recebe os dados do guia e a engine empacotada por esbuild. As nove fotos e todo o conteúdo permanecem no documento privado `manual/laboratory`. Nada técnico é copiado à pasta pública.

Execute `npm test` e `npm run build`. A prévia local é `private-build/laboratory.html`; a publicação segue o workflow Firebase existente. O navegador precisa de WebGL para a cena. O modo de movimento reduzido mantém o resultado e a explicação sem explosão com movimentos ou flashes.


## Correção, cabos e comandos

Pontas soltas são guardadas em `state.looseEnds` e continuam no lugar após trocar fio, paleta ou câmera. Soltar um fio conectado fora de um borne o desconecta e guarda a nova posição. A troca entre bornes é transacional: se o destino estiver ocupado, a ligação anterior permanece. Esc cancela o arraste sem alterar a montagem. Após erro, “Corrigir mantendo os cabos” restaura o veículo e preserva chicotes, posições e ligações; “Recomeçar do zero” limpa tudo. A sensibilidade fica no botão dentro da cena, entre 50% e 200%, com a preferência salva neste navegador.

`explosion.js` produz fogo e fumaça com ruído animado em shaders, faíscas, onda de choque, luz e tremor transitório de câmera. O veículo mantém estilhaços com gravidade. Movimento reduzido suprime os efeitos.

`commands.js` oferece os 11 comandos da referência na aba Comandos da tela de sensores. Há busca, grade/lista, seleção, formulário de envio e histórico de confirmação. A fila simula latência e avalia conexão e acessórios no momento da confirmação. Bloqueio para o motor do jogo, buzzer altera os indicadores, GPS responde somente com fixação, e reiniciar deixa a central offline por cinco segundos sem apagar a montagem. A conexão pode ser alternada para exercitar recusas. Todos os envios e respostas são locais; não há SMS, API ou conexão ao equipamento ou DMP real.


## História em 2D

A entrada em `/?lab=3d` abre “O instalador”. A opção Oficina livre dá acesso direto à bancada. `story.js` conduz logo, conversa com saudação pelo horário de Brasília, personagem entrando no carro, trajeto dirigível com WASD/setas ou toque, piloto assistido, chegada com garagem abrindo, recepção e ordem de serviço. `city.js` desenha a cidade e animações em Canvas 2D, limita o carro às ruas e segue os percursos; `story-model.js` monta as 16 combinações válidas das funções disponíveis.

O 3D carrega ao entrar na oficina. A ordem de serviço é uma missão personalizada; reiniciar ou corrigir mantém essa configuração. Após a partida correta, o carro segue um percurso automático. O mesmo painel é acoplado abaixo do mapa, com suas abas e fila de comandos. Bloqueio para o veículo, desbloqueio libera o percurso, e o comando de posição usa as coordenadas do mapa virtual. O teste pede uma volta, posição e os testes dos acessórios escolhidos; ao concluir, há uma tela de entrega e novo atendimento. Retornar à oficina preserva a montagem e permite continuar o teste.

O mapa e os comandos não acessam serviços externos. A etapa 2D e os controles de toque funcionam sem dependências adicionais. O renderizador 3D fica suspenso quando a oficina está escondida.

