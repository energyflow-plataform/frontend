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

// ------------------- Dark Mode Toggle -------------------
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  html.classList.add('dark');
}

darkModeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  const theme = html.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);

  if (energyChart) updateChartColors();
});

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

// ------------------- Chart.js -------------------
let energyChart;

const isDark = () => html.classList.contains('dark');

const getChartColors = () => ({
  grid: isDark() ? 'hsl(220, 10%, 30%)' : 'hsl(220, 13%, 90%)',
  text: isDark() ? 'hsl(0, 0%, 80%)' : 'hsl(220, 8%, 35%)',
  primary: 'hsl(158 84% 35% / 0.38)',
});

function createChart(canvas) {
  if (!canvas) return; // protege caso canvas não exista
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = getChartColors();

  energyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Consumo de Energia (kWh)',
        data: [420, 380, 450, 390, 470, 410, 430],
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
            label: (context) => `${context.dataset.label}: ${context.parsed.y} kWh`
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

function updateChartColors() {
  if (!energyChart) return;
  const colors = getChartColors();
  energyChart.options.plugins.legend.labels.color = colors.text;
  energyChart.options.plugins.tooltip.backgroundColor = isDark() ? 'hsl(220, 12%, 20%)' : 'hsl(0,0%,100%)';
  energyChart.options.plugins.tooltip.titleColor = colors.text;
  energyChart.options.plugins.tooltip.bodyColor = colors.text;
  energyChart.options.plugins.tooltip.borderColor = colors.grid;
  energyChart.options.scales.x.ticks.color = colors.text;
  energyChart.options.scales.y.ticks.color = colors.text;
  energyChart.options.scales.y.grid.color = colors.grid;
  energyChart.update();
}

// ------------------- carrega as seções por fetch -------------------
const main = document.getElementById('main-content');

async function loadSection(sectionName) {
  try {
    const response = await fetch(`${sectionName}.html`);
    if (!response.ok) throw new Error(`Erro ao carregar ${sectionName}`);
    main.innerHTML = await response.text();

    // espera o DOM atualizar antes de inicializar chart ou JS da seção
    requestAnimationFrame(() => {
      if (sectionName === 'overview') {
        const canvas = document.getElementById('energyChart');
        if (canvas) createChart(canvas);
      }

      if (sectionName === 'units') UnitsModule.initUnitsSection();
      if (sectionName === 'rooms') RoomsModule.initRoomsSection();
      if (sectionName === 'devices') DevicesModule.initDevicesSection();
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
