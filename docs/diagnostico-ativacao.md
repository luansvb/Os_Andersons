# Diagnóstico da ativação — segunda parte, versão 1.2.0

O Ato 3 continua com digitação do IMEI e 20 etapas. A primeira posição agora pode exigir uma investigação antes de ficar verde. Todos os dados e procedimentos são uma simulação local do jogo.

## Cenários

Cada novo atendimento determina um dos quatro cenários. O mesmo caso sempre retoma o mesmo cenário e a mesma ordem de alternativas.

| Cenário | Evidências | Conduta |
| --- | --- | --- |
| Sem falha | IMEIs iguais, alimentação atual de 12,6 V, comunicação e recepção presentes | Aguardar a aquisição normal |
| Vínculo divergente | A etiqueta e o cadastro diferem; uma importação antiga regravou o vínculo após a sincronização | Corrigir o vínculo do aparelho no cadastro |
| Alimentação | O teste inicial registrou 12,6 V; a leitura atual caiu para 0,0 V após movimentar o veículo e a comunicação está ausente | Pedir revisão da alimentação ao técnico |
| Recepção | Cadastro e alimentação conferem, GSM está on-line, mas o GNSS mostra zero satélites em um teste sob cobertura metálica | Pedir novo teste de recepção em área aberta |

As medições são evidências fictícias deste cenário. O jogo não executa comandos em equipamentos, não envia mensagens reais e não substitui o manual do fabricante.

## Fluxo

1. Enviar Solicitar posição atual.
2. Em uma falha, a conferência inicial abre o diagnóstico após 6 segundos. Esperar mais ou reenviar o comando não remove a falha.
3. Ler Cadastro, Laudo e Telemetria. O quadro inicial conta como aberto; as condutas só ficam disponíveis depois de visitar os três.
4. Selecionar uma conduta com base nos dados. A ordem das quatro alternativas é embaralhada e estável durante a leitura.
5. A conduta correta registra uma solicitação e aguarda 3,5 segundos de confirmação. Não há derrota por essa espera.
6. A confirmação atualiza os indicadores. O jogador precisa selecionar e enviar uma nova solicitação de posição.
7. Depois do prazo normal de aquisição, herdado da qualidade da instalação, o GPS fica verde. Seguem os envios da localização e das credenciais.

No caso saudável, o diagnóstico pode ser aberto voluntariamente durante a espera. Escolher Aguardar conserva o tempo já adquirido. Inventar uma correção que os dados não sustentam causa demissão, assim como escolher uma conduta errada nas outras situações.

O perfil Estagiário acrescenta uma dica ao painel. Bear e o técnico continuam pressionando; durante a confirmação, as mensagens reconhecem que a conferência está em andamento. Abrir uma foto, o guia ou ocultar a página mantém a pausa da simulação.

## Saves e checkpoints

O estado da ativação passou à versão 3. São preservados quadro aberto, fontes visitadas, conduta, tempo de confirmação e espera da nova posição. Uma falha de diagnóstico retoma a mesma conferência nos perfis Estagiário e Efetivado. Contrato de experiência mantém a regra de encerrar a campanha.

Saves das versões 1 e 2 migram para o fluxo original de espera. Não recebem falhas retroativas e continuam compatíveis ao serem salvos novamente. Inicie outro atendimento para receber os novos cenários.

O restaurador rejeita estados incompatíveis: GPS liberado antes de resolver uma falha, correção sem consultar as fontes, conduta de outro cenário ou confirmação com duração inválida. A ponte do frame reconhece diagnóstico e confirmação sem marcar a ativação como concluída.

## Verificação

O build estático e os 103 testes cobrem os fluxos anteriores e sete verificações novas: três falhas completas até o fim da ativação, caso saudável, evidências e embaralhamento, restauração intermediária, migração dos saves e interação real dos painéis em JSDOM. Os testes da interface verificam a nova solicitação após o reparo, a ordem estável durante cobranças, demissão, checkpoint e retomada.

A revisão visual usa o navegador com casos preparados pelo próprio núcleo do jogo. Páginas temporárias de QA são removidas antes da publicação. A campanha permanece individual, sem novos serviços externos ou dependências.

No navegador, um caso de alimentação foi percorrido desde a solicitação da posição até o fim do Ato 3, incluindo diagnóstico errado, demissão, checkpoint, recarga, correção, novo comando e envio de localização e acesso. O painel de recepção foi revisado em 390 pixels, sem rolagem horizontal; o caso saudável preservou os seis segundos de espera ao escolher Aguardar. A mensagem de confirmação reconhece imediatamente a conduta registrada. Não houve teste em aparelho físico.
