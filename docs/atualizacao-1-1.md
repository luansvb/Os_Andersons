# Atualização 1.1 — um expediente completo

As melhorias aprovadas foram integradas à campanha e aos modos individuais. O jogo continua estático, individual e compatível com GitHub Pages. A oficina 3D permanece separada para prática.

## Decisões, dificuldades e retomadas

A instalação guarda o ponto escolhido, a organização do chicote e a conferência da antena. O ladrão comenta o esconderijo efetivamente usado. Os preparativos opcionais melhoram os índices de ocultação e sinal, exibidos na entrega. Com sinal de 100%, a primeira posição leva 13 segundos em vez dos 18 segundos básicos, a localização permanece válida por mais tempo e a janela de bloqueio ganha 0,35 segundo.

| Perfil | Checkpoints | Prazo da perseguição | Janela básica | Aproximação estável |
| --- | --- | --- | --- | --- |
| Estagiário | Sim | 100 s | 3,2 s | 1,6 s |
| Efetivado | Sim | 70 s | 1,5 s | 2,2 s |
| Contrato de experiência | Não | 60 s | 1,1 s | 2,4 s |

O perfil também altera velocidade dos técnicos no mapa, frequência das cobranças e quantidade de botões na ativação. Checkpoints retomam a etapa preservando cliente e erros anteriores. Na perseguição, a retomada volta ao briefing para permitir uma nova corrida completa. Contrato de experiência mantém o encerramento da campanha ao cometer um erro grave.

## Personagens, clientes e ativação

Cat, Bear e Rô têm quatro expressões e reagem à etapa, demora, ações repetidas, falhas e conclusão. A paciência muda suas expressões e cobranças; esgotá-la não causa derrota por si só. O GPS em espera recebe uma reação própria, pois o jogador depende do equipamento. A trilha e os sinais sonoros são sintetizados localmente e respeitam o controle de som.

Três variações de cliente mudam nome e horário, mantendo o Ford Ka da história. Uma envia dados fragmentados e depois corrige veículo e horário; outra responde por áudio. Cada áudio sempre oferece transcrição e cópia do dado completo. A síntese de voz depende das vozes disponíveis no navegador; o texto permanece acessível mesmo sem esse recurso.

As 20 etapas da ativação continuam variadas e exigem seguir a ordem visível. Cinco delas agora exigem conferir informação: modelo da etiqueta, veículo e placa, ignição desligada, ignição ligada e IMEI em um cadastro duplicado. A ação seguinte fica bloqueada até resolver a conferência.

## Cidade, direção e desafio final

A cidade recebeu placas e estabelecimentos cômicos, obras com colisão, pedestres e ambientação de patrulha. Os controles continuam absolutos: a seta aponta a direção na tela, independentemente da orientação do carro.

A perseguição destaca alcançar, acompanhar e bloquear, com aviso sonoro e visual. O bloqueio continua exigindo posição, direção, velocidade e momento corretos. O direcional fica à esquerda e Comandos/Bloquear à direita no celular. Segurar uma direção durante a contagem regressiva funciona assim que a largada termina; a troca de fase preserva o botão de toque e a tecla pressionada.

## Avaliação, conquistas e encerramento

O relatório mostra nota de cada ato, tempo ativo, erros, retomadas, colisões e qualidade da instalação. Erros, retomadas, colisões e excesso de tempo afetam a nota, com três avaliações de encerramento. A cena extra apresenta o currículo de Anderson, o ladrão.

As conquistas reconhecem campanha concluída, ausência de erros graves, IMEI de primeira, instalação sem explosão, perseguição sem colisão, instalação caprichada, leitura completa da bronca e conclusão no Contrato de experiência. Os 12 resultados recentes e as conquistas ficam em registros separados: substituir um resultado antigo não apaga uma conquista.

Não há ranking on-line nem sincronização entre aparelhos. Todos os dados do jogo são fictícios e os resultados ficam no navegador usado para jogar.

## Verificação

- `npm run build`: estilos de celular e oficina de prática compilados.
- `npm test`: 88 testes automatizados aprovados, incluindo efeitos entre atos, cinco conferências, compatibilidade de saves, checkpoints, preservação das métricas, conquistas e direção mantida na largada.
- Campanha completa no navegador, na dificuldade Efetivado: agendamento, instalação com qualidade 100%, ativação com as cinco conferências, fuga com o Ka e perseguição vencida até o relatório. Falhas deliberadas verificaram explosão, demissão, bloqueio antecipado e retomadas.
- Revisão de instalação, ativação, perseguição e relatório em larguras de 360 e 390 pixels, sem rolagem horizontal. Na corrida, direcional, freio, Turbo e comando ficaram dentro da altura de 844 pixels.
- Compatibilidade com viewport largo conferida em uma página temporária de QA, removida antes da publicação. A revisão foi feita no navegador; não substitui teste em um aparelho físico.

Saves anteriores são migrados. Para começar com todas as variações e selecionar um perfil, use Novo expediente. A publicação mantém os arquivos na branch principal e o conteúdo estático de `dist/` na raiz de `gh-pages`.
