document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:8080/api";
  const form = document.getElementById("formAmbiente");
  const unidadeSelect = document.getElementById("unidade");
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

  // 🔹 Carregar unidades cadastradas
  async function carregarUnidades() {
    try {
      const res = await fetch(`${BACKEND_URL}/unidades`, {
        headers: { "Authorization": token}
      });

      if (!res.ok) throw new Error("Erro ao buscar unidades");
      const unidades = await res.json();

      unidades.forEach(u => {
        const option = document.createElement("option");
        option.value = u.id;
        option.textContent = u.nome;
        unidadeSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
      showAlert("Erro ao carregar unidades.", "error");
    }
  }

  carregarUnidades();

  // 🔹 Enviar formulário de cadastro
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nome: document.getElementById("nomeAmbiente").value,
      descricao: document.getElementById("descricao").value,
      unidade: { id: parseInt(unidadeSelect.value) }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/ambientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showAlert("Ambiente cadastrado com sucesso!", "success");
        form.reset();
      } else {
        const err = await res.text();
        showAlert("Erro ao cadastrar ambiente: " + err, "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  });
});
