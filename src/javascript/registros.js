document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:8080/api";
  const alertBox = document.getElementById("alert");

  const usuarioData = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioData || !usuarioData.token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const token = usuarioData.token.startsWith("Bearer ")
    ? usuarioData.token
    : `Bearer ${usuarioData.token}`;

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove("show"), 4000);
  }

  async function carregarTabela(endpoint, tabelaId, montarLinha) {
    try {
      const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
        headers: { Authorization: token },
      });

      if (!res.ok) throw new Error(`Erro ao carregar ${endpoint}`);
      const dados = await res.json();

      const tbody = document.querySelector(`#${tabelaId} tbody`);
      tbody.innerHTML = "";

      dados.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = montarLinha(item);
        tbody.appendChild(tr);

        // adiciona eventos nos botões de excluir
        const btnExcluir = tr.querySelector(".btn-excluir");
        btnExcluir.addEventListener("click", () =>
          excluirRegistro(endpoint, item.id, tr)
        );
      });
    } catch (error) {
      console.error(`Erro ao carregar ${endpoint}:`, error);
      showAlert(`Erro ao carregar ${endpoint}.`, "error");
    }
  }

  async function excluirRegistro(endpoint, id, linhaElemento) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      if (res.ok) {
        linhaElemento.remove();
        showAlert("Registro excluído com sucesso!", "success");
      } else {
        const err = await res.text();
        showAlert("Erro ao excluir: " + err, "error");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  }

  // Funções para montar as linhas das tabelas:
  const montarUnidade = (u) => `
    <td>${u.id}</td>
    <td>${u.nome}</td>
    <td>${u.codigoAcesso}</td>
    <td>${u.endereco?.cep || "-"}</td>
    <td>
      <button class="button-secondary small">Editar</button>
      <button class="button-danger small btn-excluir">Excluir</button>
    </td>
  `;

  const montarAmbiente = (a) => `
    <td>${a.id}</td>
    <td>${a.nome}</td>
    <td>${a.unidade?.nome || "-"}</td>
    <td>
      <button class="button-secondary small">Editar</button>
      <button class="button-danger small btn-excluir">Excluir</button>
    </td>
  `;

  const montarDispositivo = (d) => `
    <td>${d.id}</td>
    <td>${d.nome}</td>
    <td>${d.tipo}</td>
    <td>${d.ambiente?.nome || "-"}</td>
    <td>
      <span class="device-status ${d.status ? "active" : "inactive"}">
        ${d.status ? "Ativo" : "Inativo"}
      </span>
    </td>
    <td>
      <button class="button-secondary small">Editar</button>
      <button class="button-danger small btn-excluir">Excluir</button>
    </td>
  `;

  // Carrega todas as tabelas
  carregarTabela("unidades", "tabelaUnidades", montarUnidade);
  carregarTabela("ambientes", "tabelaAmbientes", montarAmbiente);
  carregarTabela("dispositivos", "tabelaDispositivos", montarDispositivo);
});
