# Ato 3 · Ativação · versão 0.4

## Implementação

Campanha: agendamento → instalação física → ativação. O Ato 3 recebe o mesmo cliente, veículo, caso e local da instalação. A instalação 2D deixou de anunciar o cliente liberado antes dos testes. A prática LCV5 permanece separada.

O IMEI é gerado por partida, tem 15 dígitos e aparece no SVG da etiqueta enviado pelo técnico junto com S/N e ICCID. O jogador precisa digitá-lo manualmente. A imagem do local da instalação mostra o ponto escolhido no Ato 2. Ambas podem ser ampliadas.

São 20 etapas com oito ações por tela, incluindo uma resposta correta, quatro apresentações de sistema e posições estáveis durante cada etapa. Bear pressiona por frases que mudam ao longo do tempo. As mensagens do técnico chegam a cada 3,5 segundos e produzem notificações visuais persistentes com texto maior, contador, pulsação moderada de borda e som, respeitando a preferência de áudio.

O comando correto é “Solicitar posição atual”. A posição fica verde após 18 segundos de simulação ativa. O jogador copia o endereço/coordenadas e envia ao técnico. Em seguida, seis telas liberam o acesso. Login e senha devem ser copiados e enviados ao cliente, em um contato separado. Conteúdo alterado ou destinatário errado causa demissão pela Cat.

Na conclusão, cliente e técnico agradecem; Cat e Bear elogiam; a mensagem “INSTALAÇÃO CONCLUÍDA COM SUCESSO” acompanha o veículo em movimento automático. O modo de movimento reduzido mantém o mapa estático.

Não existe cronômetro de derrota. Foco da dificuldade: identificar a ação atual, lidar com notificações e conferir números/contatos. Fotos e ajuda pausam a simulação. Tudo acontece no navegador e usa dados fictícios.

## Bear careca

Fonte: `Gemini_Generated_Image_ns1aqens1aqens1a.jpeg`, fornecida por Luan. Arte final: `dist/assets/bear-careca.png`. Edição feita pela ferramenta integrada de imagem, preservando rosto, olhos, expressão, orelhas, estilo e fundo. O topo ficou liso e o tufo foi removido.

Prompt final:

> Use case: precise-object-edit. Asset type: portrait of Bear, supervisor in the game OS ANDERSONS. Edit the supplied bear portrait. Make Bear visibly bald on the TOP of the head: remove the small dark tuft at the crown and give him a smooth, clearly hairless, softly shaded warm light tan scalp between the two ears. Keep the same friendly bear identity, eyes, eyebrows, face, nose, smile, ears, fur on cheeks and neck, crop, illustration style, lighting and original soft green/beige background. The bald patch should be unmistakable but look natural and humorous, not a wound. Change only the top-of-head hair/scalp. No text, no watermark, no extra objects.

## Verificação

36 testes Node aprovados: regressões dos atos anteriores; migração de oito para doze fios; IMEI; todas as distrações das 20 telas; espera real pela posição; destinatários e integridade das mensagens; seis telas de acesso; retomada de espera e rascunhos; passagem do Ato 2 para o Ato 3; isolamento de saves; movimento automático no mapa.

Testes em aparelhos físicos não realizados. Validação visual no navegador desktop: fotos do técnico e ampliação; digitação manual do IMEI; as 20 telas completas; solicitação de posição, espera e indicador verde; cópia/colagem/envio da localização ao técnico; seis telas de acesso; cópia/colagem/envio das credenciais ao cliente; mensagem final, agradecimentos e elogios. O atributo de posição do veículo mudou durante a observação, confirmando o movimento automático.

Também foi jogada a instalação 2D completa com doze fios, seguindo para a ativação com o mesmo cliente, veículo e acabamento lateral traseiro. Na largura de 390 px foram verificados etiqueta e campo de IMEI, bloqueio de colagem, entrada nas telas do Bear, demissão por ação errada, diálogo da Cat e ausência de rolagem horizontal. Após o ajuste, a posição do supervisor ficou acima do painel de tarefas.

Prévias: `docs/ativacao.jpg` e `docs/ativacao-concluida.jpg`.

## Atualização 0.5

As cobranças usam frases em caixa alta, mais duras, e uma faixa fixa com técnico e Bear. A faixa permanece à vista ao rolar a página, tem pulsação de 1,4 s e é estática quando movimento reduzido está ativo. Ela não captura cliques dos controles. A área superior reserva espaço para a faixa, inclusive em telas estreitas. As mensagens do WhatsApp e a fala do supervisor também foram ampliadas.

A conclusão agora oferece “Continuar para O grande roubo”. Foi percorrido no navegador todo o Ato 3 atualizado até a entrada real no Ato 4. A faixa teve posição fixa confirmada antes e depois de rolar e animação CSS verificada; o layout de 390 px não apresentou rolagem horizontal. Prévia: `docs/cobrancas.jpg`.
