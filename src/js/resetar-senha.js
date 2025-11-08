document.addEventListener('DOMContentLoaded', function () {
  const BACKEND_URL = 'http://localhost:8080';

  const resetForm = document.getElementById('resetForm');
  const novaSenhaInput = document.getElementById('novaSenha');
  const alertBox = document.getElementById('alert'); 

    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`; 
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 5000);
    }

  function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isLongEnough;
  }

  function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  }

  function updatePasswordStrength(password) {
    let strengthBar = document.getElementById('passwordStrengthBar');
    if (!strengthBar) {
      strengthBar = document.createElement('div');
      strengthBar.id = 'passwordStrengthBar';
      strengthBar.className = 'password-strength-bar';
      novaSenhaInput.insertAdjacentElement('afterend', strengthBar);
    }

    const strength = calculatePasswordStrength(password);
    strengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
      strengthBar.classList.add('weak');
    } else if (strength <= 4) {
      strengthBar.classList.add('medium');
    } else {
      strengthBar.classList.add('strong');
    }
  }

  novaSenhaInput.addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
  });

  function obterTokenDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = obterTokenDaURL();
    const novaSenha = novaSenhaInput.value.trim();

    if (!token) {
        showAlert('Token não encontrado. O link pode estar incorreto', 'error');
            return;
    }

    if (!validatePassword(novaSenha)) {
        showAlert('Senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, número e caractere especial.', 'error');
            return;
    }

    try {
      const response = await fetch(BACKEND_URL + '/api/usuarios/senha/resetar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, novaSenha: novaSenha })
      });

      const data = await response.text();

      if (response.ok) {
        showAlert(data, 'success');
        resetForm.reset();
        setTimeout(() => window.location.href = 'login.html', 3000);
      } else {
        showAlert(data || "Erro ao redefinir senha.", 'error');
      }

    } catch (error) {
            showAlert("Erro de conexão com o servidor.", 'error');
    }
  });
});
