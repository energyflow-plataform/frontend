document.addEventListener('DOMContentLoaded', function () {
const BACKEND_URL = 'http://localhost:8080';

   const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      window.location.href = 'dashboard.html';
      return;
    }

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const alertBox = document.getElementById('alert');

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => {
      alertBox.classList.remove('show');
    }, 5000);
  }

  function showError(input, errorElement, message) {
    input.classList.add('input-error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  function clearError(input, errorElement) {
    input.classList.remove('input-error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateForm() {
    let isValid = true;

    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) {
      showError(emailInput, emailError, 'E-mail é obrigatório');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(emailInput, emailError, 'Digite um e-mail válido');
      isValid = false;
    }

    if (!password) {
      showError(passwordInput, passwordError, 'Senha é obrigatória');
      isValid = false;
    }

    return isValid;
  }

  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const email = emailInput.value.trim();
    const senha = passwordInput.value.trim();

    try {
      const response = await fetch(BACKEND_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (response.status === 401) {
        showAlert('E-mail ou senha inválidos!', 'error');
        return;
      }

      if (!response.ok) {
        showAlert('Erro no servidor. Tente novamente mais tarde.', 'error');
        return;
      }

      const result = await response.json();

      if (result && result.token) {
        const usuario = {
          token: result.token,
          nome: result.nome,
          sobrenome: result.sobrenome,
          foto: result.foto || 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=U'
        };

        localStorage.setItem('usuario', JSON.stringify(usuario));

      showAlert('Login concluído! Redirecionando...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
      } 
    } catch (error) {
      console.error(error);
      showAlert('Erro de conexão. Verifique se a API está rodando.', 'error');
    }
  });
});
