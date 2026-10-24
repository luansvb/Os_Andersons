export const TITLE = 'OS ANDERSONS — INSTALANDO E ROUBANDO';
export const SAVE_VERSION = 1;
export const INTRO = [
  {
    incoming: 'Bom dia, gostaria de colocar um rastreador no meu veículo',
    options: [
      'Olá, bom dia, meu nome é Anderson e irei realizar o agendamento.',
      'Bom dia, sou o Anderson, não estou disponível agora, tente entrar em contato amanhã.',
      'Aqui quem fala é Anderson, não instalamos rastreadores, somos uma empresa de fachada que lava dinheiro.',
      'A vida é como uma rosa que endurece seus espinhos e machuca teu coração.',
      'Não quero te atender. Tchau.'
    ], correct: 0
  },
  {
    incoming: 'Olá Anderson, meu nome também é Anderson. Como funciona o rastreador?',
    options: [
      'Funciona que nem tua mãe. Mal.',
      'Não sei, aguarde um momento enquanto verifico com o Anderson, nosso técnico.',
      'Pra que rastreador? Tenha fé!',
      'Funciona da seguinte forma. Nós fazemos a instalação aqui em nossa sede, você consegue acompanhar o seu veículo em tempo real pelo aplicativo, e tem a função de bloquear ele também, caso deseje. A instalação é rápida e não prejudica de forma alguma o seu veículo, nem drena a sua bateria. É uma segurança a mais para o senhor e sua família e só tem vantagens.',
      'A gente instala o rastreador, você nos dá dinheiro e todo mundo sai feliz. Você, meu patrão, e os ladrões que irão saber exatamente onde ele foi instalado já que nossos técnicos não costumam esconder ele muito bem. Vai querer meu chapa?'
    ], correct: 3
  }
];
export const FIELDS = [
  { key:'name', label:'Nome completo', request:'Nome completo?', options:[
    'Qual sua cor favorita?', 'Quem mandou matar Marielle?', 'Qual o nome completo do senhor?',
    'Se João tem duas maçãs, ele come uma, quem gosta de frutas?', 'Tu é gay?'
  ], correct:2, answer:'Anderson da Silva Anderson' },
  { key:'vehicle', label:'Marca e modelo do veículo', request:'Qual a marca e modelo do seu veículo?', options:[
    'Seu carro é bom?', 'Não é fusca, né?', 'A vida é loca, né parceiro?',
    'Se eu escrevesse um livro, tu lerias?', 'Qual a marca e modelo do veículo do senhor?'
  ], correct:4, answer:'Ford Ka' },
  { key:'availability', label:'Disponibilidade', request:'Para quando o senhor tem disponibilidade?', options:[
    'Vai ser amanhã, tá bom? Sem choro.', 'Pode chegar aí, estamos abertos.',
    'A vida é feita de escolhas. Não te darei nenhuma.', 'Para quando o senhor gostaria de agendar?',
    'Meu emprego é tão chato.'
  ], correct:3, answer:'Para amanhã, meio dia.' }
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
