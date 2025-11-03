document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('header');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const contactForm = document.getElementById('contactForm');

  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  mobileMenuToggle.addEventListener('click', function() {
    nav.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const headerHeight = header.offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        nav.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        message: document.getElementById('message').value
      };
      
      console.log('Formulário enviado:', formData);
      
      alert('Agradecemos pelo interesse! Nossa equipe entrará em contato com você em breve.');
      
      contactForm.reset();
    });
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.feature-card, .benefit-card, .use-case-card, .testimonial-card, .pricing-card');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  document.querySelectorAll('.dashboard-mockup').forEach(el => {
    el.classList.add('animate-fade-in-right');
    observer.observe(el);
  });

  document.querySelectorAll('.chart-bars .bar').forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
    el.classList.add('animate-grow-up');
    observer.observe(el);
  });

  // animação do gráfico em real-time
  const bars = document.querySelectorAll('.chart-bars .bar');
  const currentUsageElement = document.querySelector('.metrics-grid .metric-card:first-child span:last-child');
  const todaysCostElement = document.querySelector('.metrics-grid .metric-card:last-child span:last-child');

  if (bars.length > 0) {
    let animationStarted = false;

    const startChartAnimation = () => {
      if (animationStarted) return;
      animationStarted = true;

      // função pra gerar alturas aleatorias entre min e max
      const getRandomHeight = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      // função pra gerar consumos aleatorios entre 1.5 e 3.5 kw
      const getRandomUsage = () => {
        return (Math.random() * 2 + 1.5).toFixed(1);
      };

      // função pra calcular o custo baseado no consumo (R$5 por kw)
      const calculateCost = (usage) => {
        return (parseFloat(usage) * 5).toFixed(2);
      };

      // barras ficam se mexendo continuamente
      setInterval(() => {
        bars.forEach(bar => {
          const newHeight = getRandomHeight(40, 95);
          bar.style.height = `${newHeight}%`;
        });

        // atualiza consumo e custo a cada 1.5s
        const newUsage = getRandomUsage();
        const newCost = calculateCost(newUsage);
        
        if (currentUsageElement) {
          currentUsageElement.textContent = `${newUsage} kW`;
        }
        if (todaysCostElement) {
          todaysCostElement.textContent = `R$${newCost}`;
        }
      }, 1500);
    };

    // animação começa quando hero tá visível
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startChartAnimation();
        }
      });
    }, {
      threshold: 0.3
    });

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      heroObserver.observe(heroSection);
    }
  }
});
