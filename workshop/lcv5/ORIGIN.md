# Origem do simulador

Copiado do repositório privado do autor, `luansvb/LCV5`, por meio do plugin GitHub, no commit `ce506d38ec448f3e6e283e311bcd470bbe86372a` (branch principal consultada em 23/10/2026).

Origem: diretório `laboratory/`. A documentação original é `README.md` neste diretório. As nove fotos são as originais. O modelo de rastreador, veículo, chicotes, interação, missões, telemetria e comandos foram mantidos.

Os dados de pinos e famílias e a função de cores foram extraídos do `index.html` cujo Git blob é `a4e2f670a4b4ad4ad2237221dcf84d7654ef1d5d`, conferido contra a árvore do mesmo commit. Apenas o conteúdo necessário à oficina foi incorporado; o manual completo e a configuração do Firebase não entram neste projeto.

Adaptações: ponto de entrada após o agendamento; contexto de cliente/veículo/data; salvamento e retomada; mensagens com o jogo principal; cores da cena e cidade; interface com Cat; entrada livre; conclusão e retorno ao agendamento; tolerância do percurso a quedas de quadros.

A engine usa Three.js 0.180.0. A licença de terceiros é preservada pelo empacotamento com comentários legais inline. As ligações são didáticas e não validam instalação física ou configuração real de veículos.
