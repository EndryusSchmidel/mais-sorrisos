// DEMONSTRAÇÃO de assistente no site.
// Não usa IA de verdade: responde com textos do próprio site da clínica (FAQ, etapas, procedimentos)
// e monta o agendamento em etapas. Na versão contratada, o mesmo painel liga a um assistente real.
// Reaproveita CLINIC, nextDates e slotsFor de script.js.

const BOT_FAQ = [
  {
    id: 'dor',
    words: ['doi', 'dor', 'sofr', 'anestesia', 'cirurgia', 'machuc', 'medo', 'dolor'],
    text: 'O tratamento é feito com anestesia e todo o cuidado necessário. A maioria dos pacientes relata um desconforto menor do que imaginava, comparável ao de uma extração comum.',
  },
  {
    id: 'tempo',
    words: ['demora', 'tempo', 'cicatriz', 'quanto tempo', 'prazo', 'dias', 'meses', 'anos', 'carga imediata', 'mesmo dia'],
    text: 'A cicatrização faz parte do processo para o implante ficar firme e seguro, e não demora anos. Em casos selecionados é possível instalar o implante e uma prótese provisória no mesmo dia (carga imediata), para você não ficar sem dentes no caminho. O prazo exato do seu caso é definido na avaliação.',
  },
  {
    id: 'preco',
    words: ['preco', 'valor', 'custa', 'caro', 'pagar', 'pagamento', 'parcel', 'orcamento', 'quanto'],
    text: 'O valor depende do seu caso (quantos dentes, tipo de prótese e planejamento), por isso não passo preço pelo chat. A clínica tem condições de pagamento facilitadas, e na avaliação você recebe o plano com etapas, prazos e valores explicados.',
  },
  {
    id: 'unitario',
    words: ['unitario', 'um dente', 'perdi um', 'poucos dentes', 'implante'],
    text: 'O implante unitário é indicado para quem perdeu um ou poucos dentes e quer recuperar a estética, a mastigação e a confiança com uma solução fixa e duradoura.',
  },
  {
    id: 'protocolo',
    words: ['protocolo', 'dentadura', 'chapa', 'todos os dentes', 'arcada', 'solta', 'prótese', 'protese'],
    text: 'A prótese protocolo é indicada para quem perdeu todos os dentes de uma arcada e quer voltar a sorrir, falar e mastigar com mais segurança e conforto. Também é uma opção para quem está cansado de dentadura que solta.',
  },
  {
    id: 'etapas',
    words: ['etapa', 'como funciona', 'primeira consulta', 'avaliacao', 'processo', 'passo'],
    text: 'São 4 etapas: 1) avaliação e planejamento, com exame da condição óssea; 2) instalação do implante de titânio; 3) cicatrização, em que o implante se integra ao osso; 4) prótese definitiva, com estética e função recuperadas. Tudo é explicado antes de você decidir.',
  },
  {
    id: 'servicos',
    words: ['trata', 'servico', 'especialidade', 'fazem', 'ortodontia', 'aparelho', 'canal', 'endodontia', 'crianca', 'infantil', 'periodontia', 'dentistica', 'siso', 'clinica geral', 'limpeza'],
    text: 'Além dos implantes (unitário, protocolo e carga imediata), a clínica atende Clínica Geral, Periodontia, Dentística, Cirurgia Oral Menor, Odontopediatria, Ortodontia e Endodontia.',
  },
  {
    id: 'local',
    words: ['onde', 'endereco', 'fica', 'local', 'chegar', 'rua', 'horario', 'abre', 'fecha', 'aberto', 'funciona', 'sabado', 'domingo'],
    text: null, // montado na hora, com o status de funcionamento
  },
  {
    id: 'quem',
    words: ['quem', 'doutora', 'dra', 'andressa', 'dentista', 'profissional', 'equipe', 'especialista'],
    text: 'Quem cuida dos implantes é a Dra. Andressa Castro de Queiroz, implantodontista e protesista, dentro de uma equipe multidisciplinar com mais de 10 mil atendimentos.',
  },
];

const QUICK_QUESTIONS = [
  ['Dói fazer implante?', 'dor'],
  ['Quanto tempo demora?', 'tempo'],
  ['Quanto custa?', 'preco'],
  ['Como funciona?', 'etapas'],
  ['Onde fica e que horas abre?', 'local'],
];

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const botHours = () => {
  const clock = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[clock.weekday];
  const min = Number(clock.hour) * 60 + Number(clock.minute);
  const today = CLINIC.hours[wd];
  if (today && min >= today[0] && min < today[1]) return 'Estamos abertos agora.';
  return 'No momento estamos fechados, e a recepção responde assim que abrir.';
};

const localAnswer = () => `Ficamos na Rua Luiz Alves Cavalcante, 689, loja C, Vilar dos Teles, São João de Meriti (rua da feira, em frente à Toca dos Bichos). Atendemos de segunda a sexta, das 9h às 17h30, e aos sábados, das 9h às 12h. ${botHours()}`;

(() => {
  const root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML = `
    <button type="button" class="chat-launcher" aria-label="Abrir assistente virtual" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
      <span>Tire suas dúvidas</span>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="Assistente virtual da Mais Sorrisos" hidden>
      <header class="chat-head">
        <div>
          <strong>Assistente Mais Sorrisos</strong>
          <small>Demonstração · respostas baseadas no site da clínica</small>
        </div>
        <button type="button" class="chat-close" aria-label="Fechar">×</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-quick"></div>
      <form class="chat-form" autocomplete="off">
        <input type="text" class="chat-input" placeholder="Digite sua dúvida..." aria-label="Digite sua dúvida" />
        <button type="submit" class="chat-send" aria-label="Enviar">→</button>
      </form>
      <p class="chat-note">O assistente não dá diagnóstico nem passa preço. A recepção confirma tudo.</p>
    </section>`;
  document.body.append(root);

  const launcher = root.querySelector('.chat-launcher');
  const panel = root.querySelector('.chat-panel');
  const log = root.querySelector('.chat-log');
  const quick = root.querySelector('.chat-quick');
  const form = root.querySelector('.chat-form');
  const input = root.querySelector('.chat-input');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flow = { active: false, step: null, data: {} };
  let greeted = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (who, text) => {
    const el = document.createElement('p');
    el.className = `chat-msg chat-${who}`;
    el.textContent = text;
    log.append(el);
    scroll();
    return el;
  };
  const addLink = (label, href) => {
    const a = document.createElement('a');
    a.className = 'chat-cta';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label;
    log.append(a);
    scroll();
  };
  const setQuick = (options) => {
    quick.replaceChildren();
    options.forEach(([label, action]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = label;
      b.addEventListener('click', () => { addMsg('user', label); handle(action, label); });
      quick.append(b);
    });
  };
  const bot = (text, after) => {
    const typing = addMsg('bot', '…');
    typing.classList.add('is-typing');
    setTimeout(() => {
      typing.classList.remove('is-typing');
      typing.textContent = text;
      scroll();
      after?.();
    }, reduce ? 0 : 650);
  };

  const mainMenu = () => setQuick([...QUICK_QUESTIONS, ['Quero agendar', 'agendar']]);
  const bookingBtn = () => setQuick([['Quero agendar', 'agendar'], ['Outra dúvida', 'menu']]);

  // Fluxo de agendamento (pré-agendamento: a recepção confirma)
  const TREATMENTS = ['Implante unitário', 'Prótese protocolo', 'Carga imediata', 'Clínica geral', 'Periodontia', 'Dentística', 'Cirurgia oral menor', 'Odontopediatria', 'Ortodontia', 'Endodontia'];
  const startFlow = () => {
    flow.active = true; flow.step = 'treatment'; flow.data = {};
    bot('Vamos deixar seu agendamento encaminhado. Qual tratamento você quer avaliar?', () => setQuick([...TREATMENTS.map((t) => [t, `t:${t}`]), ['Ainda não sei', 't:'], ['Outra dúvida', 'menu']]));
  };
  const askDate = () => {
    flow.step = 'date';
    const dates = nextDates('any', 6);
    bot('Que dia fica melhor para você?', () => setQuick(dates.map((d) => [d.short, `d:${d.key}`])));
  };
  const askTime = () => {
    flow.step = 'time';
    const hours = slotsFor('any', flow.data.date.wd);
    bot('E o horário?', () => setQuick(hours.map((h) => [`${h}h`, `h:${h}`])));
  };
  const askName = () => {
    flow.step = 'name';
    setQuick([]);
    bot('Qual o seu nome?');
    input.focus();
  };
  const finishFlow = () => {
    const d = flow.data;
    const lines = [`Olá! Gostaria de agendar uma avaliação na ${CLINIC.name}.`];
    lines.push(d.treatment ? `Interesse: ${d.treatment}.` : 'Ainda não sei qual tratamento.');
    lines.push(`Quando: ${d.date.long}, às ${d.time}h.`);
    if (d.name) lines.push(`Nome: ${d.name}.`);
    lines.push('(Pedido feito pelo assistente do site)');
    flow.active = false; flow.step = null;
    bot(`Pronto${d.name ? `, ${d.name}` : ''}! Deixei seu pedido montado: ${d.treatment || 'avaliação'}, ${d.date.long}, às ${d.time}h. Toque abaixo para enviar à recepção, que confirma a disponibilidade com você.`, () => {
      addLink('Enviar para a recepção no WhatsApp →', `https://api.whatsapp.com/send?phone=${CLINIC.whatsapp}&text=${encodeURIComponent(lines.join('\n'))}`);
      mainMenu();
    });
  };

  const answer = (id) => {
    const item = BOT_FAQ.find((f) => f.id === id);
    const text = id === 'local' ? localAnswer() : item.text;
    bot(text, id === 'preco' || id === 'dor' || id === 'tempo' ? bookingBtn : mainMenu);
  };

  const handle = (action, raw = '') => {
    if (action === 'menu') { flow.active = false; flow.step = null; bot('Claro! Qual é a sua dúvida?', mainMenu); return; }
    if (action === 'agendar') { startFlow(); return; }
    if (action.startsWith('t:')) { flow.data.treatment = action.slice(2); askDate(); return; }
    if (action.startsWith('d:')) {
      flow.data.date = nextDates('any', 6).find((d) => d.key === action.slice(2));
      askTime();
      return;
    }
    if (action.startsWith('h:')) { flow.data.time = Number(action.slice(2)); askName(); return; }
    answer(action);
  };

  const interpret = (text) => {
    const q = norm(text);
    if (/(agendar|marcar|consulta|avaliacao|quero ir|reservar)/.test(q) && !/(primeira consulta|como funciona)/.test(q)) return 'agendar';
    let best = null; let bestScore = 0;
    BOT_FAQ.forEach((f) => {
      const score = f.words.reduce((n, w) => n + (q.includes(norm(w)) ? 1 : 0), 0);
      if (score > bestScore) { best = f.id; bestScore = score; }
    });
    return best;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);
    if (flow.active && flow.step === 'name') {
      flow.data.name = text.split(/\s+/)[0].slice(0, 30);
      finishFlow();
      return;
    }
    if (flow.active) { // texto livre no meio do fluxo: lembra a etapa
      bot('Para continuar o agendamento, escolha uma das opções acima. Se preferir, toque em "Outra dúvida".');
      return;
    }
    const found = interpret(text);
    if (found) { handle(found, text); return; }
    bot('Não tenho essa informação com segurança. Posso deixar seu pedido encaminhado para a recepção, que responde direitinho. Quer agendar uma avaliação?', bookingBtn);
  });

  const open = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    if (!greeted) {
      greeted = true;
      addMsg('bot', 'Oi! Sou o assistente virtual da Mais Sorrisos (demonstração). Posso tirar dúvidas sobre implantes e deixar seu agendamento encaminhado. Como posso ajudar?');
      mainMenu();
    }
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    launcher.focus();
  };
  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('.chat-close').addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) close(); });
})();
