document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:8080/api";
  const form = document.getElementById("formUnidade");
  const alertBox = document.getElementById("alert");

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

  // 🔹 Buscar endereço pelo CEP
  const cepInput = document.getElementById("cep");
  cepInput.addEventListener("blur", async () => {
    const cep = cepInput.value.replace(/\D/g, ""); // remove traço
    if (cep.length < 8) {
      showAlert("CEP inválido!", "error");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/endereco/${cep}`, {
        headers: { "Authorization": token}
      });

      if (!res.ok) throw new Error("Erro ao buscar endereço");
      const endereco = await res.json();

      // Preenche automaticamente os campos se existirem no objeto retornado
      // Preenche automaticamente os campos se existirem no objeto retornado
    const logradouroInput = document.getElementById("logradouro");
    const bairroInput = document.getElementById("bairro");
    const cidadeInput = document.getElementById("cidade");
    const estadoInput = document.getElementById("estado");

    if (logradouroInput) logradouroInput.value = endereco.logradouro || "";
    if (bairroInput) bairroInput.value = endereco.bairro || "";
    if (cidadeInput) cidadeInput.value = endereco.cidade || "";
    if (estadoInput) estadoInput.value = endereco.estado || "";

      showAlert("Endereço encontrado!", "success");
    } catch (error) {
      console.error("Erro no CEP:", error);
      showAlert("CEP não encontrado!", "error");
    }
  });

  // 🔹 Enviar formulário para cadastrar unidade
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nome: document.getElementById("nomeUnidade").value,
      codigoAcesso: document.getElementById("codigoAcesso").value,
      endereco: {
        cep: document.getElementById("cep").value,
        numero: document.getElementById("numero").value
      }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/unidades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showAlert("Unidade cadastrada com sucesso!", "success");
        form.reset();
      } else {
        const err = await res.text();
        showAlert("Erro ao cadastrar unidade: " + err, "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  });
});
