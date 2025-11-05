document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:8080/api";
  const form = document.getElementById("formDispositivo");
  const ambienteSelect = document.getElementById("ambiente");
  const alertBox = document.getElementById("alert");

  // 🔐 Verifica se o usuário está logado
  const usuarioData = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioData || !usuarioData.token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const token = usuarioData.token;

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove("show"), 4000);
  }

  // 🔹 Carregar ambientes cadastrados
  async function carregarAmbientes() {
    try {
      const res = await fetch(`${BACKEND_URL}/ambientes`, {
        headers: { "Authorization": token }
      });

      if (!res.ok) throw new Error("Erro ao buscar ambientes");
      const ambientes = await res.json();

      ambientes.forEach(a => {
        const option = document.createElement("option");
        option.value = a.id;
        option.textContent = a.nome;
        ambienteSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
      showAlert("Erro ao carregar ambientes.", "error");
    }
  }

  carregarAmbientes();

  // 🔹 Enviar formulário de cadastro
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nome: document.getElementById("nomeDispositivo").value,
      tipo: document.getElementById("tipoDispositivo").value,
      potencia: document.getElementById("potencia").value,
      status: true,
      ambiente: { id: parseInt(ambienteSelect.value) }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/dispositivos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showAlert("Dispositivo cadastrado com sucesso!", "success");
        form.reset();
      } else {
        const err = await res.text();
        showAlert("Erro ao cadastrar dispositivo: " + err, "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  });
});
