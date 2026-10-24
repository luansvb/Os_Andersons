export const TITLE = 'OS ANDERSONS — INSTALANDO E ROUBANDO';
export const SAVE_VERSION = 1;
export const INTRO = [
  {
    incoming: 'Bom dia, gostaria de colocar um rastreador no meu veículo',
    brief: 'Apresente-se e conduza o atendimento. Explique o serviço antes de confirmar dados e agenda. A central define o técnico; o acesso ao aplicativo só é liberado após instalação e testes.',
    options: [
      'Bom dia! Sou Anderson e vou cuidar do seu atendimento. Primeiro explico o serviço e depois confirmamos seus dados e a agenda.',
      'Bom dia! Sou Anderson e já confirmei sua instalação para amanhã ao meio-dia. Pode vir direto, sem precisar consultar nossa agenda.',
      'Bom dia! Sou Anderson e posso liberar seu acesso ao aplicativo agora. O agendamento e a instalação ficam para depois que o senhor entrar.',
      'A vida é como uma rosa que endurece seus espinhos e machuca teu coração.',
      'Bom dia! Sou Anderson. Escolha primeiro qual técnico o senhor prefere; vou definir o atendimento por essa preferência, antes de explicar o serviço.'
    ], correct: 0,
    feedback: [null,
      'Você confirmou um horário antes de consultar a disponibilidade do cliente e a agenda. Apresente-se e conduza o atendimento primeiro.',
      'O acesso ao aplicativo só é liberado depois da instalação e dos testes. Não prometa uma liberação antes dessas etapas.',
      'O cliente pediu uma instalação. A filosofia da rosa não apresentou o atendente nem iniciou o atendimento.',
      'A central define o técnico na etapa de despacho, conforme a proximidade. Não antecipe essa escolha pela preferência do cliente.'
    ]
  },
  {
    incoming: 'Olá Anderson, meu nome também é Anderson. Como funciona o rastreador?',
    brief: 'Serviço desta ordem: instalação na sede, acompanhamento em tempo real pelo aplicativo e bloqueio por comando da plataforma. O acesso é enviado após instalação e testes.',
    options: [
      'Instalamos na sede, e o senhor acompanha no aplicativo. O login é liberado antes da instalação; os testes são feitos depois, se necessário.',
      'Instalamos na sede, e o senhor acompanha em tempo real. O bloqueio acontece automaticamente sempre que o veículo sai do trajeto habitual.',
      'O rastreador funciona na base da fé e do medo da Cat. Se o carro sumir, fazemos uma reunião e pedimos para ele voltar.',
      'Instalamos na sede, com acompanhamento em tempo real no aplicativo e bloqueio por comando da plataforma. Enviamos o acesso após os testes.',
      'A instalação é na sede e o acesso vem após os testes. O veículo só aparece no aplicativo depois que parar; em movimento, não é atualizado.'
    ], correct: 3,
    feedback: [
      'Nesta ordem, instalação e testes vêm antes do envio do acesso. Os testes não são opcionais.',
      'Você prometeu um bloqueio automático por desvio de trajeto. Nesta ordem, o bloqueio depende de um comando pela plataforma.',
      'Fé e reunião não explicam o serviço. Use as funções descritas na ordem de serviço.',null,
      'O acompanhamento desta ordem é em tempo real, inclusive com o veículo em movimento. Você informou uma limitação que não consta no serviço.'
    ]
  }
];
export const FIELDS = [
  { key:'name', label:'Nome completo', request:'Nome completo?',
    brief:'Confirme o nome completo deste cliente. Não presuma sobrenomes nem use o nome do técnico, do perfil do WhatsApp ou de outro atendimento.',
    options:[
      'Para preencher o cadastro, posso registrar apenas Anderson e completar o restante depois, usando o nome que aparece no seu WhatsApp?',
      'Para preencher o cadastro, qual nome devo colocar como responsável: o do técnico que fará a instalação ou o nome da nossa empresa?',
      'Para preencher o cadastro, qual é o nome completo do senhor, incluindo os sobrenomes, conforme deve aparecer na ordem de serviço?',
      'Para preencher o cadastro, vou usar Anderson da Silva, que consta no atendimento anterior. Podemos seguir direto para o veículo?',
      'Para preencher o cadastro, preciso do seu nome de herói. Anderson Homem-Rastreador já está ocupado pelo pessoal do turno da noite.'
    ], correct:2, answer:'Anderson da Silva Anderson',
    feedback:[
      'O campo exige o nome completo confirmado pelo cliente. O primeiro nome e o perfil do WhatsApp não substituem essa informação.',
      'A ficha pede o nome completo do cliente. O nome do técnico ou da empresa não preenche esse campo.',null,
      'Você reaproveitou o nome de outro atendimento sem confirmar os dados deste cliente. Pergunte o nome completo dele.',
      'O RH ainda não aceita identidades secretas. A ficha precisa do nome completo do cliente.'
    ] },
  { key:'vehicle', label:'Marca e modelo do veículo', request:'Qual a marca e modelo do seu veículo?',
    brief:'Confirme marca e modelo com este cliente. Placa ou fabricante isolada não substituem os dois dados solicitados nesta ficha.',
    options:[
      'O sistema precisa da marca e do modelo. Posso registrar Ford Ka, como no último atendimento, e seguir sem conferir com o senhor?',
      'Para identificar o veículo, informe somente a placa. Vou deixar marca e modelo em branco e preencher quando o técnico retornar.',
      'Para identificar o veículo, o senhor confirma apenas a fabricante? Com a marca preenchida, o modelo pode ser escolhido pelo técnico.',
      'Para identificar o veículo, ele é do tipo que funciona ou do tipo que só funciona depois de alguém dizer: agora vai, meu guerreiro?',
      'Para identificar o veículo desta instalação, qual é a marca e o modelo dele? Preciso confirmar as duas informações com o senhor.'
    ], correct:4, answer:'Ford Ka',
    feedback:[
      'Mesmo que o modelo coincida, você não pode copiar o veículo de outro atendimento sem confirmar os dados deste cliente.',
      'Esta etapa pede marca e modelo. Pedir somente a placa deixa as duas informações solicitadas sem resposta.',
      'A fabricante sozinha não informa o modelo. Peça as duas informações ao cliente.',
      'A torcida pelo carro não identifica marca e modelo. Pergunte os dados que a ficha está pedindo.',null
    ] },
  { key:'availability', label:'Disponibilidade', request:'Para quando o senhor tem disponibilidade?',
    brief:'Peça dia e horário ao cliente antes de confirmar a agenda. Não imponha um horário nem reaproveite a disponibilidade de outro atendimento.',
    options:[
      'Para agilizar a agenda, já deixei amanhã ao meio-dia reservado para o senhor. Vou considerar esse horário confirmado e encerrar.',
      'Para consultar a agenda, diga apenas qual dia prefere. Vou escolher o horário que ficar melhor para o técnico, sem precisar confirmar.',
      'Para consultar a agenda, preciso saber em qual fase da Lua o senhor prefere instalar. A Cat não autoriza serviço durante Mercúrio retrógrado.',
      'Para consultar a agenda sem escolher pelo senhor, em que dia e horário o senhor tem disponibilidade para realizar a instalação?',
      'Para consultar a agenda, vou usar a disponibilidade do cliente anterior e encaminhar sua confirmação. Se não servir, o senhor avisa depois.'
    ], correct:3, answer:'Para amanhã, meio dia.',
    feedback:[
      'Você confirmou um horário antes de perguntar a disponibilidade do cliente. Mesmo uma coincidência não substitui essa confirmação.',
      'A ficha precisa de dia e horário informados pelo cliente. Não escolha a hora por ele sem confirmar.',
      'A agenda usa dia e horário, Anderson. O mapa astral ainda não foi integrado ao sistema.',null,
      'A disponibilidade pertence a este cliente. Não reaproveite o horário de outro atendimento.'
    ] }
];
export function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();
}
export function validateField(index, value, answer = FIELDS[index]?.answer) {
  return !!answer && normalize(value) === normalize(answer);
}
export function nearestIds(client, technicians) {
  if (!client || !technicians.length) return [];
  const distances = technicians.map(t => ({ id:t.id, d:(client.x-t.x)**2+(client.y-t.y)**2 }));
  const min = Math.min(...distances.map(t=>t.d));
  return distances.filter(t=>Math.abs(t.d-min)<1e-6).map(t=>t.id);
}
export function saoPauloDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get = type=>parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDays(iso, count) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate()+count);
  return date.toISOString().slice(0,10);
}
export function isCorrectBooking(baseDate, day, time) { return day === addDays(baseDate,1) && time === '12:00'; }
export function routePosition(route, progress) {
  const lengths = route.map((p,i)=>Math.hypot(p[0]-route[(i+1)%route.length][0],p[1]-route[(i+1)%route.length][1]));
  const total = lengths.reduce((a,b)=>a+b,0);
  let remaining = ((progress%total)+total)%total;
  for(let i=0;i<route.length;i++){
    if(remaining<=lengths[i]){
      const t=lengths[i]?remaining/lengths[i]:0;
      const next=route[(i+1)%route.length];
      return {x:route[i][0]+(next[0]-route[i][0])*t,y:route[i][1]+(next[1]-route[i][1])*t};
    }
    remaining-=lengths[i];
  }
  return {x:route[0][0],y:route[0][1]};
}
