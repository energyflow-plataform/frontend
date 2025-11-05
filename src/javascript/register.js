document.addEventListener('DOMContentLoaded', function() {
  const BACKEND_URL = 'http://localhost:8080';

  const registerForm = document.getElementById('registerForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = document.getElementById('terms');
  const passwordStrengthBar = document.getElementById('passwordStrengthBar');
  const alertBox = document.getElementById('alert');
  const submitButton = registerForm.querySelector('button[type="submit"]');

  const firstNameError = document.getElementById('firstNameError');
  const lastNameError = document.getElementById('lastNameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const termsError = document.getElementById('termsError');

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove('show'), 5000);
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
    const strength = calculatePasswordStrength(password);
    passwordStrengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
      passwordStrengthBar.classList.add('weak');
    } else if (strength <= 4) {
      passwordStrengthBar.classList.add('medium');
    } else {
      passwordStrengthBar.classList.add('strong');
    }
  }

  passwordInput.addEventListener('input', (e) => {
    clearError(passwordInput, passwordError);
    updatePasswordStrength(e.target.value);
  });

  function validateForm() {
    let isValid = true;

    clearError(firstNameInput, firstNameError);
    clearError(lastNameInput, lastNameError);
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    clearError(confirmPasswordInput, confirmPasswordError);
    clearError(termsCheckbox, termsError);

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!firstName) {
      showError(firstNameInput, firstNameError, 'Nome é obrigatório');
      isValid = false;
    }

    if (!lastName) {
      showError(lastNameInput, lastNameError, 'Sobrenome é obrigatório');
      isValid = false;
    }

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
    } else if (!validatePassword(password)) {
      showError(passwordInput, passwordError, 'Senha deve possuir pelo menos 8 caracteres com letras maiúsculas, minúsculas, número e caractere especial');
      isValid = false;
    }

    if (!confirmPassword) {
      showError(confirmPasswordInput, confirmPasswordError, 'Por favor, confirme sua senha');
      isValid = false;
    } else if (password !== confirmPassword) {
      showError(confirmPasswordInput, confirmPasswordError, 'Senhas não são iguais');
      isValid = false;
    }

    if (!termsCheckbox.checked) {
      showError(termsCheckbox, termsError, 'Você deve concordar com os Termos de Uso e a Política de Privacidade');
      isValid = false;
    }

    return isValid;
  }

  firstNameInput.addEventListener('input', () => clearError(firstNameInput, firstNameError));
  lastNameInput.addEventListener('input', () => clearError(lastNameInput, lastNameError));
  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  confirmPasswordInput.addEventListener('input', () => clearError(confirmPasswordInput, confirmPasswordError));
  termsCheckbox.addEventListener('change', () => clearError(termsCheckbox, termsError));

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      nome: firstNameInput.value.trim(),
      sobrenome: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      senha: passwordInput.value.trim()
    };

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Cadastrando...';

    try {
      const response = await fetch(BACKEND_URL + '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        showAlert('Conta criada com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        const errorText = await response.text();
        showAlert(`Erro ao criar conta: ${errorText || 'verifique os dados e tente novamente'}`, 'error');
      }

    } catch (error) {
      console.error('Erro:', error);
      showAlert('Ocorreu um erro. Por favor, tente novamente.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Criar Conta';
    }
  });
});
