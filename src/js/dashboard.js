// verifica login e recupera o usuário
function verificarSessao() {
  const usuarioData = localStorage.getItem('usuario');

  // nenhum dado salvo → redireciona pro login
  if (!usuarioData) {
    console.warn("Nenhum usuário encontrado. Redirecionando para login...");
    window.location.href = "login.html";
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioData);

    // se não tiver token, redireciona também
    if (!usuario.token) {
      console.warn("Token ausente ou inválido. Redirecionando para login...");
      localStorage.removeItem('usuario');
      window.location.href = "login.html";
      return null;
    }

    return usuario;
  } catch (error) {
    console.error("Erro ao ler dados do usuário:", error);
    localStorage.removeItem('usuario');
    window.location.href = "login.html";
    return null;
  }
}

const usuario = verificarSessao();

function carregarAvatar() {
  const avatar = document.getElementById("userAvatar");
  if (!avatar || !usuario) return;
  if (usuario.foto && usuario.foto !== "") {
    avatar.innerHTML = `
      <img src="${usuario.foto}" alt="Foto do usuário" class="w-full h-full object-cover rounded-full">
    `;
  } else {
    const iniciais = gerarIniciais(usuario.nome);
    avatar.textContent = iniciais;
  }
}

function gerarIniciais(nome) {
  if (!nome) return "U"; // fallback

  const partes = nome.trim().split(" ");
  if (partes.length === 1) {
    return partes[0][0].toUpperCase();
  }

  return (
    partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
  );
}

// se não há usuário, para aqui — o redirecionamento já foi feito
if (usuario) {
  document.addEventListener("DOMContentLoaded", () => {
    const userNameElement = document.querySelector('user-name');
    if (userNameElement) {
      userNameElement.textContent = `${usuario.nome} ${usuario.sobrenome}`;
    }

    const userAvatar = document.querySelector('user-avatar');
    if (userAvatar) {
      userAvatar.src = usuario.foto || 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=U';
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
      });
    }
  });
}

// ------------------- Mobile Menu Toggle -------------------
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');

mobileMenuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

// fecha o menu se clicar pra fora
document.addEventListener('click', (e) => {
  if (window.innerWidth < 1024) {
    if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      sidebar.classList.add('hidden');
    }
  }
});

// sidebar no desktop
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) sidebar.classList.remove('hidden');
  else sidebar.classList.add('hidden');
});

if (window.innerWidth < 1024) sidebar.classList.add('hidden');

// ------------------- Navigation Active State -------------------
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((nav) => {
      nav.classList.remove('active', 'text-primary', 'bg-primary/10');
      nav.classList.add('text-nav-text');
    });
    item.classList.add('active', 'text-primary', 'bg-primary/10');
    item.classList.remove('text-nav-text');
  });
});

// ------------------- carrega as seções por fetch -------------------
const main = document.getElementById('main-content');

async function loadSection(sectionName) {
  try {
    const response = await fetch(`${sectionName}.html`);
    if (!response.ok) throw new Error(`Erro ao carregar ${sectionName}`);
    main.innerHTML = await response.text();

    // espera o DOM atualizar antes de inicializar chart ou JS da seção
    requestAnimationFrame(() => {
      carregarAvatar();
      if (sectionName === 'overview') {
        requestAnimationFrame(() => MyEnergyChart.initOverviewSection());
      }

      if (sectionName === 'units') UnitsModule.initUnitsSection();
      if (sectionName === 'rooms') RoomsModule.initRoomsSection();
      if (sectionName === 'devices') DevicesModule.initDevicesSection();
      if (sectionName === 'reports') ReportModule.initReportSection();
    });

  } catch (err) {
    console.error('Erro ao carregar seção:', err);
  }
}

function setActiveLink(sectionName) {
  navItems.forEach(link => {
    link.classList.remove('active', 'text-primary', 'bg-primary/10');
    link.classList.add('text-nav-text');
    if (link.dataset.section === sectionName) {
      link.classList.add('active', 'text-primary', 'bg-primary/10');
      link.classList.remove('text-nav-text');
    }
  });
}

// ------------------- Inicialização -------------------
const initialSection = location.hash ? location.hash.slice(1) : 'overview';
setActiveLink(initialSection);
loadSection(initialSection);

// Click nos links da sidebar
navItems.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const sectionName = link.dataset.section;
    if (!sectionName) return;

    setActiveLink(sectionName);
    loadSection(sectionName);
    history.replaceState(null, '', '#' + sectionName);
  });
});

// Voltar/avançar no navegador
window.addEventListener('hashchange', () => {
  const sectionName = location.hash ? location.hash.slice(1) : 'overview';
  setActiveLink(sectionName);
  loadSection(sectionName);
});

/* unified-energy-chart.js
   Substitui a parte do chart falso + o chart de consumo real.
   Colar no seu bundle / <script> depois de carregar Chart.js e antes de usar loadSection.
*/

/* -------------------- Config -------------------- */
const BACKEND_URL = window.BACKEND_URL || 'http://localhost:8080';

let energyChart = null;

/* -------------------- Sessão / Token helpers -------------------- */
function verificarSessao() {
  const usuarioData = localStorage.getItem('usuario');
  if (!usuarioData) {
    console.warn("Nenhum usuário encontrado. Redirecionando para login...");
    window.location.href = "login.html";
    return null;
  }
  try {
    const usuario = JSON.parse(usuarioData);
    if (!usuario.token) {
      console.warn("Token ausente ou inválido. Redirecionando para login...");
      localStorage.removeItem('usuario');
      window.location.href = "login.html";
      return null;
    }
    return usuario;
  } catch (error) {
    console.error("Erro ao ler dados do usuário:", error);
    localStorage.removeItem('usuario');
    window.location.href = "login.html";
    return null;
  }
}

function getAuthToken() {
  const usuarioData = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioData || !usuarioData.token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return null;
  }
  return usuarioData.token.startsWith("Bearer ")
    ? usuarioData.token
    : `Bearer ${usuarioData.token}`;
}

/* -------------------- Tema / cores do gráfico -------------------- */
const html = document.documentElement;
const isDark = () => html.classList.contains('dark');

const getChartColors = () => ({
  grid: isDark() ? 'hsl(220, 10%, 30%)' : 'hsl(220, 13%, 90%)',
  text: isDark() ? 'hsl(0, 0%, 80%)' : 'hsl(220, 8%, 35%)',
  primary: 'hsl(158 84% 35% / 0.38)'
});

function updateChartColors() {
  if (!energyChart) return;
  const colors = getChartColors();
  const opt = energyChart.options;

  if (opt.plugins && opt.plugins.legend && opt.plugins.legend.labels) {
    opt.plugins.legend.labels.color = colors.text;
  }
  if (opt.plugins && opt.plugins.tooltip) {
    opt.plugins.tooltip.backgroundColor = isDark() ? 'hsl(220, 12%, 20%)' : 'hsl(0,0%,100%)';
    opt.plugins.tooltip.titleColor = colors.text;
    opt.plugins.tooltip.bodyColor = colors.text;
    opt.plugins.tooltip.borderColor = colors.grid;
  }
  if (opt.scales) {
    if (opt.scales.x && opt.scales.x.ticks) opt.scales.x.ticks.color = colors.text;
    if (opt.scales.y && opt.scales.y.ticks) opt.scales.y.ticks.color = colors.text;
    if (opt.scales.y && opt.scales.y.grid) opt.scales.y.grid.color = colors.grid;
  }
  // atualizar dataset colors
  if (energyChart.data && energyChart.data.datasets && energyChart.data.datasets[0]) {
    energyChart.data.datasets[0].borderColor = colors.primary;
    energyChart.data.datasets[0].backgroundColor = colors.primary;
  }

  energyChart.update();
}

/* -------------------- Criação do gráfico -------------------- */
function renderStyledChart(canvasElement, labels, valores, labelDataset = 'Consumo de Energia (kWh)') {
  if (!canvasElement) return;
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;

  const colors = getChartColors();

  // destrói se existir
  if (energyChart) {
    try { energyChart.destroy(); } catch (e) { /* ignore */ }
    energyChart = null;
  }

  // criar novo chart (mantendo o visual do fake)
  energyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: labelDataset,
        data: valores,
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeInOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: colors.text, usePointStyle: true, padding: 20, font: { family: 'Inter, sans-serif', size: 12 } }
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark() ? 'hsl(220, 12%, 20%)' : 'hsl(0, 0%, 100%)',
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const val = Math.round(context.parsed.y);
              return `${context.dataset.label}: ${val} W`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: colors.text, font: { family: 'Inter, sans-serif', size: 11 } } },
        y: { beginAtZero: true, grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, font: { family: 'Inter, sans-serif', size: 11 }, callback: (v) => v + ' kWh' } }
      }
    }
  });
}

function renderStyledChart2(canvasElement, labels, valores, labelDataset = 'Consumo de Energia (kWh)') {
  if (!canvasElement) return;
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;

  const colors = getChartColors();

  // destrói se existir
  if (energyChart) {
    try { energyChart.destroy(); } catch (e) { /* ignore */ }
    energyChart = null;
  }

  // criar novo chart (mantendo o visual do fake)
  energyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: labelDataset,
        data: valores,
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeInOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: colors.text, usePointStyle: true, padding: 20, font: { family: 'Inter, sans-serif', size: 12 } }
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDark() ? 'hsl(220, 12%, 20%)' : 'hsl(0, 0%, 100%)',
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const val = Math.round(context.parsed.y);
              return `${context.dataset.label}: ${val} W`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: colors.text, font: { family: 'Inter, sans-serif', size: 11 } } },
        y: { beginAtZero: true, grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, font: { family: 'Inter, sans-serif', size: 11 }, callback: (v) => v + ' kWh' } }
      }
    }
  });
}

/* -------------------- Mensagem quando não há dados -------------------- */
function mostrarMensagemSemDados(canvasId = 'energyChart', mensagem = 'Nenhum dado desse dispositivo disponível.') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "16px Inter, Arial";
  ctx.fillStyle = isDark() ? "#bbb" : "#777";
  ctx.textAlign = "center";
  ctx.fillText(mensagem, canvas.width / 2, canvas.height / 2);
}

/* -------------------- Carregar dispositivos (com header) -------------------- */
async function carregarDispositivos(selectId = 'selectDispositivo') {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/dispositivos`, {
      headers: { Authorization: token }
    });
    if (!res.ok) {
      console.error('Erro ao carregar dispositivos. status:', res.status);
      return [];
    }
    const dispositivos = await res.json();

    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`Select com id "${selectId}" não encontrado no DOM.`);
      return dispositivos;
    }

    // limpar opções antigas
    select.innerHTML = '';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Selecione um dispositivo';
    select.appendChild(emptyOption);

    dispositivos.forEach(d => {
      const option = document.createElement("option");
      option.value = d.id;
      option.textContent = d.nome;
      select.appendChild(option);
    });

    // se existir pelo menos 1 dispositivo, seleciona o primeiro automaticamente
    if (dispositivos.length > 0) {
      select.value = dispositivos[0].id;
      carregarConsumoDiario(dispositivos[0].id);
    }

    return dispositivos;
  } catch (error) {
    console.error("Erro ao carregar dispositivos:", error);
    return [];
  }
}

/* -------------------- Carregar consumo mensal (com header) -------------------- */
async function carregarConsumoMensal(dispositivoId, canvasId = 'energyChart') {
  if (!dispositivoId) {
    mostrarMensagemSemDados(canvasId, 'Selecione um dispositivo.');
    return;
  }

  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/consumo/dispositivo/${dispositivoId}/mes`, {
      headers: { Authorization: token }
    });

    if (!res.ok) {
      console.error('Erro ao carregar consumo. status:', res.status);
      mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
      return;
    }

    const dados = await res.json();
    const pontos = dados.pontos || [];

    if (!pontos || pontos.length === 0) {
      mostrarMensagemSemDados(canvasId, 'Nenhum dado disponível para este mês.');
      return;
    }

    // --- Agrupamento por dia ---
    const agrupado = {};
    pontos.forEach(p => {
      const data = new Date(p.timestamp);
      const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      if (!agrupado[dia]) agrupado[dia] = { soma: 0, qtd: 0 };
      agrupado[dia].soma += (p.medio ?? 0);
      agrupado[dia].qtd++;
    });

    const labels = Object.keys(agrupado).sort((a, b) => {
      const [diaA, mesA] = a.split('/').map(Number);
      const [diaB, mesB] = b.split('/').map(Number);

      const dataA = new Date(2025, mesA - 1, diaA);
      const dataB = new Date(2025, mesB - 1, diaB);

      return dataA - dataB;
    });

    const valores = labels.map(dia => {
      const item = agrupado[dia];
      return item.qtd ? (item.soma / item.qtd) : 0;
    });

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas "${canvasId}" não encontrado.`);
      return;
    }

    renderStyledChart(canvas, labels, valores, 'Consumo Médio Diário');

  } catch (error) {
    console.error("Erro ao carregar consumo:", error);
    mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
  }
}

/* -------------------- Carregar consumo diário -------------------- */
async function carregarConsumoDiario(dispositivoId, canvasId = 'energyChart') {
  if (!dispositivoId) {
    mostrarMensagemSemDados(canvasId, 'Selecione um dispositivo.');
    return;
  }

  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/consumo/dispositivo/${dispositivoId}/24h`, {
      headers: { Authorization: token }
    });

    if (!res.ok) {
      mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
      return;
    }

    const dados = await res.json();
    const pontos = dados.pontos || [];

    if (pontos.length === 0) {
      mostrarMensagemSemDados(canvasId, 'Nenhum dado nas últimas 24h.');
      return;
    }

    // Ordenar por timestamp crescente
    pontos.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = pontos.map(p => new Date(p.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    const valores = pontos.map(p => Math.round(p.medio ?? 0));

    const canvas = document.getElementById(canvasId);
    renderStyledChart(canvas, labels, valores, 'Consumo Médio');

  } catch (error) {
    mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
  }
}

/* -------------------- Carregar consumo semanal -------------------- */
async function carregarConsumoSemanal(dispositivoId, canvasId = 'energyChart') {
  if (!dispositivoId) {
    mostrarMensagemSemDados(canvasId, 'Selecione um dispositivo.');
    return;
  }

  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/consumo/dispositivo/${dispositivoId}/semana`, {
      headers: { Authorization: token }
    });

    if (!res.ok) {
      mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
      return;
    }

    const dados = await res.json();
    const pontos = dados.pontos || [];

    if (pontos.length === 0) {
      mostrarMensagemSemDados(canvasId, 'Nenhum dado disponível para esta semana.');
      return;
    }

    // Agrupar por dia da semana
    const agrupado = {};

    pontos.forEach(p => {
      const d = new Date(p.timestamp);
      const dia = d.toLocaleDateString("pt-BR", { weekday: "short" }); // seg, ter, qua...

      if (!agrupado[dia]) agrupado[dia] = { soma: 0, qtd: 0 };
      agrupado[dia].soma += p.medio ?? 0;
      agrupado[dia].qtd++;
    });

    const ordemSemana = ["seg.", "ter.", "qua.", "qui.", "sex.", "sáb.", "dom."];

    const labels = ordemSemana.filter(d => agrupado[d]);
    const valores = labels.map(d => Math.round(agrupado[d].soma / agrupado[d].qtd));

    const canvas = document.getElementById(canvasId);
    renderStyledChart(canvas, labels, valores, 'Consumo Médio Diário');

  } catch (error) {
    mostrarMensagemSemDados(canvasId, 'Erro ao buscar dados.');
  }
}

// =============================
// CONFIGURAÇÃO DO REAL-TIME
// =============================
let intervaloRealTime = null;
let realTimeData = []; // últimos pontos (máx 40s)

// Função para iniciar o modo tempo real
function iniciarConsumoTempoReal(dispositivoId) {
  // limpa intervalo anterior (se existir)
  if (intervaloRealTime) {
    clearInterval(intervaloRealTime);
  }

  // reseta dados
  realTimeData = [];
  atualizarGraficoRealTime();

  // inicia novo intervalo a cada 2s
  intervaloRealTime = setInterval(async () => {
    await obterConsumoTempoReal(dispositivoId);
  }, 2000);
}

// =============================
// PEGA O TOKEN COMO NO RESTO DO PROJETO
// =============================
function getAuthToken() {
  const usuarioData = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioData || !usuarioData.token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return null;
  }
  return usuarioData.token.startsWith("Bearer ")
    ? usuarioData.token
    : `Bearer ${usuarioData.token}`;
}

// =============================
// CHAMADA AO ENDPOINT TEMPO REAL
// =============================
async function obterConsumoTempoReal(dispositivoId) {
  try {
    const token = getAuthToken();
    if (!token) return;

    const res = await fetch(`${BACKEND_URL}/api/consumo/tempo-real/${dispositivoId}`, {
      headers: { Authorization: token }
    });

    if (!res.ok) throw new Error("Erro ao buscar consumo em tempo real.");

    const json = await res.json();

    const novoPonto = {
      tempo: new Date(json.data),
      valor: json.consumo
    };

    // adiciona novo ponto
    realTimeData.push(novoPonto);

    // mantém apenas últimos 40 segundos
    const agora = Date.now();
    realTimeData = realTimeData.filter(p => (agora - p.tempo.getTime()) <= 40000);

    // atualiza o gráfico
    atualizarGraficoRealTime();

  } catch (err) {
    console.error("Erro no tempo real:", err);
  }
}

// =============================
// FUNÇÃO QUE DESENHA O GRÁFICO EM TEMPO REAL
// =============================
function atualizarGraficoRealTime() {
  const labels = realTimeData.map(p =>
    p.tempo.toLocaleTimeString("pt-BR", { hour12: false })
  );

  const valores = realTimeData.map(p => p.valor);

  // Atualiza o gráfico já existente (energyChart)
  energyChart.data.labels = labels;
  energyChart.data.datasets[0].data = valores;

  // tooltip arredondando valores
  energyChart.options.plugins.tooltip.callbacks.label = function (ctx) {
    return `${ctx.dataset.label}: ${ctx.raw.toFixed(0)} W`;
  };

  energyChart.update();
}

/* -------------------- Integração com a seção overview -------------------- */
function initOverviewSection() {
  const select = document.getElementById('selectDispositivo');
  const canvas = document.getElementById('energyChart');

  if (!canvas) {
    console.warn('Canvas #energyChart não encontrado na overview.');
    return;
  }

  if (!select) {
    try {
      const wrapper = canvas.parentElement || document.body;
      const container = document.createElement('div');
      container.className = 'flex items-center gap-4 mb-4';
      container.innerHTML = `
        <label class="text-sm font-medium">Dispositivo:</label>
        <select id="selectDispositivo" class="border rounded px-2 py-1"></select>
      `;
      wrapper.insertBefore(container, canvas);
    } catch (e) {
      console.warn('Não foi possível inserir select dinamicamente:', e);
    }
  }

  // carregar dispositivos e ligar evento de change
  carregarDispositivos().then(() => {
    const sel = document.getElementById('selectDispositivo');
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      pararTempoReal();
      const id = e.target.value;
      if (id) {
        marcarAtivo(btnDia);
        carregarConsumoDiario(id);
      }
      else mostrarMensagemSemDados('energyChart', 'Selecione um dispositivo.');
    });
  });

  // -------------------- Botões de filtro --------------------
  const btnDia = document.getElementById("btnDia");
  const btnSemana = document.getElementById("btnSemana");
  const btnMes = document.getElementById("btnMes");

  function pararTempoReal() {
    if (intervaloRealTime) {
      clearInterval(intervaloRealTime);
      intervaloRealTime = null;
    }
  }

  function marcarAtivo(btn) {
    [btnDia, btnSemana, btnMes, btnTempoReal].forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");
  }

  btnDia?.addEventListener("click", () => {
    pararTempoReal();
    const id = document.getElementById("selectDispositivo").value;
    marcarAtivo(btnDia);
    carregarConsumoDiario(id);
  });

  btnSemana?.addEventListener("click", () => {
    pararTempoReal();
    const id = document.getElementById("selectDispositivo").value;
    marcarAtivo(btnSemana);
    carregarConsumoSemanal(id);
  });

  btnMes?.addEventListener("click", () => {
    pararTempoReal();
    const id = document.getElementById("selectDispositivo").value;
    marcarAtivo(btnMes);
    carregarConsumoMensal(id);
  });

  btnTempoReal?.addEventListener("click", () => {
    const id = document.getElementById("selectDispositivo").value;
    marcarAtivo(btnTempoReal);
    iniciarConsumoTempoReal(id);
  });
}

/* -------------------- Hook para theme toggle -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      requestAnimationFrame(() => {
        updateChartColors();
      });
    });
  }

  const canvas = document.getElementById('energyChart');
  const select = document.getElementById('selectDispositivo');
  if (canvas) {
    initOverviewSection();
  }
});

/* -------------------- Export / exposição global -------------------- */
window.MyEnergyChart = {
  initOverviewSection,
  carregarConsumoMensal,
  carregarDispositivos,
  iniciarConsumoTempoReal,
  renderStyledChart,
  updateChartColors
};

window.ReportModule = {
  renderChartAgg(lista) {
    const canvas = document.getElementById("reportChart");

    const labels = lista.map(x => x.label);
    const min = lista.map(x => x.min);
    const med = lista.map(x => x.medio);
    const max = lista.map(x => x.max);

    renderStyledChart2(canvas, labels, med, "Consumo Médio");

    energyChart.data.datasets.push({ label: "Mín", data: min });
    energyChart.data.datasets.push({ label: "Máx", data: max });
    energyChart.update();
  },

  renderResumoAgg(lista) {
    const box = document.getElementById("reportResumo");

    const total = lista.reduce((s, p) => s + p.medio, 0);
    const media = total / lista.length;
    const max = Math.max(...lista.map(p => p.max));
    const min = Math.min(...lista.map(p => p.min));

    box.innerHTML = `
        <p><strong>Total:</strong> ${total.toFixed(2)} W</p>
        <p><strong>Média Geral:</strong> ${media.toFixed(2)} w</p>
        <p><strong>Máximo:</strong> ${max.toFixed(2)} W</p>
        <p><strong>Mínimo:</strong> ${min.toFixed(2)} W</p>
    `;
  },

  renderTabelaAgg(lista) {
    const tb = document.getElementById("reportTabela");
    tb.innerHTML = "";

    lista.forEach(p => {
      tb.innerHTML += `
            <tr>
                <td class="center">${p.label}</td>
                <td class="center">${p.min.toFixed(2)}</td>
                <td class="center">${p.max.toFixed(2)}</td>
                <td class="center">${p.medio.toFixed(2)}</td>
            </tr>
        `;
    });
  },

  groupByHour(pontos) {
    const grupos = {};

    pontos.forEach(p => {
      const d = new Date(p.timestamp);
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit" });

      if (!grupos[hora]) grupos[hora] = { min: 0, max: 0, medio: 0, qtd: 0 };

      grupos[hora].min += p.min;
      grupos[hora].max += p.max;
      grupos[hora].medio += p.medio;
      grupos[hora].qtd++;
    });

    return Object.keys(grupos).map(h => ({
      label: h + ":00",
      min: grupos[h].min / grupos[h].qtd,
      max: grupos[h].max / grupos[h].qtd,
      medio: grupos[h].medio / grupos[h].qtd
    }));
  },

  groupByDay(pontos) {
    const grupos = {};

    pontos.forEach(p => {
      const d = new Date(p.timestamp);
      const dia = d.toLocaleDateString("pt-BR");

      if (!grupos[dia]) grupos[dia] = { min: 0, max: 0, medio: 0, qtd: 0 };

      grupos[dia].min += p.min;
      grupos[dia].max += p.max;
      grupos[dia].medio += p.medio;
      grupos[dia].qtd++;
    });

    return Object.keys(grupos).map(d => ({
      label: d,
      min: grupos[d].min / grupos[d].qtd,
      max: grupos[d].max / grupos[d].qtd,
      medio: grupos[d].medio / grupos[d].qtd
    }));
  },

  groupIntervalManual(lista) {
    // usa o inicioIntervalo como label
    const grupos = {};

    lista.forEach(p => {
      const d = new Date(p.inicioIntervalo);
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit" });

      if (!grupos[hora]) grupos[hora] = { min: 0, max: 0, medio: 0, qtd: 0 };

      grupos[hora].min += p.consumoMin;
      grupos[hora].max += p.consumoMax;
      grupos[hora].medio += p.consumoMedio;
      grupos[hora].qtd++;
    });

    return Object.keys(grupos).map(h => ({
      label: h + ":00",
      min: grupos[h].min / grupos[h].qtd,
      max: grupos[h].max / grupos[h].qtd,
      medio: grupos[h].medio / grupos[h].qtd
    }));
  },


  async initReportSection() {
    console.log("📄 Iniciando seção de RELATÓRIO");

    const selDisp = document.getElementById("reportDispositivo");
    const selPeriodo = document.getElementById("reportPeriodo");
    const datasBox = document.getElementById("reportDatas");
    const btn = document.getElementById("reportGerar");

    // carregar dispositivos com token
    await carregarDispositivos("reportDispositivo");

    // alterna exibição de datas manuais
    selPeriodo.addEventListener("change", () => {
      datasBox.style.display = selPeriodo.value === "INTERVALO_MANUAL"
        ? "grid"
        : "none";
    });

    btn.addEventListener("click", async () => {
      const id = selDisp.value;
      const periodo = selPeriodo.value;

      if (!id) {
        alert("Selecione um dispositivo!");
        return;
      }

      // Se for 24h/semana/mês
      if (periodo !== "INTERVALO_MANUAL") {
        await this.buscarPeriodoPadrao(id, periodo);
      } else {
        await this.buscarPeriodoManual(id);
      }
    });
  },

  /** -----------------------
   *  PERIODOS FIXOS (24h, semana, mês)
   *  ------------------------ */
  async buscarPeriodoPadrao(id, periodo) {
    const token = getAuthToken();

    const map = {
      "ULTIMAS_24H": "24h",
      "ULTIMA_SEMANA": "semana",
      "ULTIMO_MES": "mes"
    };

    const endpoint = `${BACKEND_URL}/api/consumo/dispositivo/${id}/${map[periodo]}`;

    const res = await fetch(endpoint, { headers: { Authorization: token } });
    if (!res.ok) {
      alert("Erro ao buscar dados");
      return;
    }

    const dados = await res.json();
    const pontos = dados.pontos || [];

    if (periodo === "ULTIMAS_24H") {
      const agrupado = this.groupByHour(pontos);
      this.renderChartAgg(agrupado);
      this.renderResumoAgg(agrupado);
      this.renderTabelaAgg(agrupado);
      return;
    }

    if (periodo === "ULTIMA_SEMANA") {
      const agrupado = this.groupByDay(pontos);
      this.renderChartAgg(agrupado);
      this.renderResumoAgg(agrupado);
      this.renderTabelaAgg(agrupado);
      return;
    }

    if (periodo === "ULTIMO_MES") {
      const agrupado = this.groupByDay(pontos);
      this.renderChartAgg(agrupado);
      this.renderResumoAgg(agrupado);
      this.renderTabelaAgg(agrupado);
      return;
    }

    const agrupado = this.groupIntervalManual(lista);
    this.renderChartAgg(agrupado);
    this.renderResumoAgg(agrupado);
    this.renderTabelaAgg(agrupado);

  },

  /** -----------------------
   *  PERÍODO MANUAL (INÍCIO / FIM)
   *  ------------------------ */
  async buscarPeriodoManual(id) {
    const token = getAuthToken();

    const inicio = document.getElementById("reportInicio").value;
    const fim = document.getElementById("reportFim").value;

    if (!inicio || !fim) {
      alert("Preencha início e fim!");
      return;
    }

    const url =
      `${BACKEND_URL}/consumo/dispositivo/${id}?inicio=${inicio}&fim=${fim}`;

    const res = await fetch(url, { headers: { Authorization: token } });
    const lista = await res.json(); // ESTE endpoint retorna LISTA

    this.renderChartIntervalos(lista);
    this.renderResumoIntervalos(lista);
    this.renderTabelaIntervalos(lista);
  },

  /** -----------------------
   *  GRÁFICO PARA PERIODOS FIXOS (pontos[])
   *  ------------------------ */
  renderChartFromPontos(pontos) {
    const canvas = document.getElementById("reportChart");

    const labels = pontos.map(p =>
      new Date(p.timestamp).toLocaleString("pt-BR")
    );

    const min = pontos.map(p => p.min);
    const med = pontos.map(p => p.medio);
    const max = pontos.map(p => p.max);

    renderStyledChart(canvas, labels, med, "Consumo Médio");

    energyChart.data.datasets.push({
      label: "Mín",
      data: min,
      borderWidth: 2
    });

    energyChart.data.datasets.push({
      label: "Máx",
      data: max,
      borderWidth: 2
    });

    energyChart.update();
  },

  /** -----------------------
   *  GRÁFICO PERÍODO MANUAL (intervalos)
   *  ------------------------ */
  renderChartIntervalos(lista) {
    const canvas = document.getElementById("reportChart");

    const labels = lista.map(
      p => new Date(p.inicioIntervalo).toLocaleTimeString("pt-BR")
    );

    const min = lista.map(p => p.consumoMin);
    const med = lista.map(p => p.consumoMedio);
    const max = lista.map(p => p.consumoMax);

    renderStyledChart(canvas, labels, med, "Consumo Médio");

    energyChart.data.datasets.push({
      label: "Mín",
      data: min
    });
    energyChart.data.datasets.push({
      label: "Máx",
      data: max
    });

    energyChart.update();
  },

  /** -----------------------
   *  RESUMO GERAL
   *  ------------------------ */
  renderResumo(pontos) {
    const box = document.getElementById("reportResumo");

    if (!pontos || pontos.length === 0) {
      box.innerHTML = "<p>Nenhum dado disponível.</p>";
      return;
    }

    const total = pontos.reduce((s, p) => s + p.medio, 0);
    const max = Math.max(...pontos.map(p => p.max));
    const min = Math.min(...pontos.map(p => p.min));
    const media = total / pontos.length;

    box.innerHTML = `
            <p><strong>Total:</strong> ${total.toFixed(2)}</p>
            <p><strong>Média Geral:</strong> ${media.toFixed(2)}</p>
            <p><strong>Máximo:</strong> ${max}</p>
            <p><strong>Mínimo:</strong> ${min}</p>
        `;
  },

  renderResumoIntervalos(lista) {
    const box = document.getElementById("reportResumo");

    if (!lista || lista.length === 0) {
      box.innerHTML = "<p>Nenhum dado disponível.</p>";
      return;
    }

    const total = lista.reduce((s, p) => s + p.consumoMedio, 0);
    const max = Math.max(...lista.map(p => p.consumoMax));
    const min = Math.min(...lista.map(p => p.consumoMin));
    const media = total / lista.length;

    box.innerHTML = `
            <p><strong>Total:</strong> ${total.toFixed(2)}</p>
            <p><strong>Média Geral:</strong> ${media.toFixed(2)}</p>
            <p><strong>Máximo:</strong> ${max}</p>
            <p><strong>Mínimo:</strong> ${min}</p>
        `;
  },

  /** -----------------------
   *  TABELA — FIXOS
   *  ------------------------ */
  renderTabelaFromPontos(pontos) {
    const tb = document.getElementById("reportTabela");
    tb.innerHTML = "";

    pontos.forEach(p => {
      tb.innerHTML += `
                <tr>
                    <td>${new Date(p.timestamp).toLocaleString("pt-BR")}</td>
                    <td>${p.min.toFixed(2)}</td>
                    <td>${p.medio.toFixed(2)}</td>
                    <td>${p.max.toFixed(2)}</td>
                </tr>
            `;
    });
  },

  /** -----------------------
   *  TABELA — INTERVALO MANUAL
   *  ------------------------ */
  renderTabelaIntervalos(lista) {
    const tb = document.getElementById("reportTabela");
    tb.innerHTML = "";

    lista.forEach(p => {
      tb.innerHTML += `
                <tr>
                    <td>${new Date(p.inicioIntervalo).toLocaleString("pt-BR")}</td>
                    <td>${p.consumoMin.toFixed(2)}</td>
                    <td>${p.consumoMedio.toFixed(2)}</td>
                    <td>${p.consumoMax.toFixed(2)}</td>
                </tr>
            `;
    });
  }
};

