document.addEventListener('DOMContentLoaded', function () {
    const BACKEND_URL = 'http://localhost:8080';

    const form = document.getElementById('recuperarForm');
    const emailInput = document.getElementById('email');
    const alertBox = document.getElementById('alert'); 
    const submitButton = form.querySelector('button[type="submit"]');

    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`; 
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 5000);
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
        showAlert('E-mail é obrigatório', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('Digite um e-mail válido', 'error');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Enviando...';

        const response = await fetch(`${BACKEND_URL}/api/usuarios/senha/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        let data = await response.text();
        try {
            data = JSON.parse(data);
        } catch {
        }

        if (response.ok) {
            showAlert(
                (data && data.message) || data || "E-mail enviado com sucesso!",
                'success'
            );
            form.reset();
        } else {
            showAlert(
                (data && data.message) || data || "Erro ao enviar e-mail de recuperação.",
                'error'
            );
        }
    } catch (error) {
        showAlert("Erro de conexão com o servidor.", 'error');
        console.error(error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar link';
    }
    });
});