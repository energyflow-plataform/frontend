/**
 * unit.js — Versão integrada com backend real (Spring Boot)
 * 
 * Responsável por gerenciar Unidades:
 *  - Buscar, cadastrar, editar e excluir unidades.
 *  - Atualizar estatísticas e renderizar tabela.
 *  - Buscar endereço via CEP.
 */

const UnitsModule = (() => {
  const BACKEND_URL = "http://localhost:8080/api";

  // ==============================
  // Estado
  // ==============================
  let units = [];
  let currentEditId = null;
  let currentDeleteId = null;
  let token = null;

  // ==============================
  // Utilitários
  // ==============================
  function showAlert(message, type = "info") {
    const alertBox = document.getElementById("alert");
    if (!alertBox) {
      alert(type.toUpperCase() + ": " + message);
      return;
    }

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove("show"), 4000);
  }

  function showAlertMain(message, type = "info") {
    const alertBox = document.getElementById("alert-main");
    if (!alertBox) {
      alert(type.toUpperCase() + ": " + message);
      return;
    }

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove("show"), 4000);
  }

  function getAuthToken() {
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    if (!usuarioData || !usuarioData.token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "login.html";
      return null;
    }
    return usuarioData.token.startsWith("Bearer ")
      ? usuarioData.token
      : `Bearer ${usuarioData.token}`;
  }

  // ==============================
  // Modais
  // ==============================
  function openAddModal() {
    currentEditId = null;
    const modalTitle = document.getElementById("modalTitle");
    const unitForm = document.getElementById("unitForm");
    const unitModal = document.getElementById("unitModal");

    if (modalTitle) modalTitle.textContent = "Nova Unidade";
    if (unitForm) unitForm.reset();
    if (unitModal) unitModal.classList.add("active");
  }

  function closeModal() {
    document.querySelectorAll(".modal.active").forEach((el) => el.classList.remove("active"));
  }

  const unitModalEl = document.getElementById("unitModal");
  const deleteModalEl = document.getElementById("deleteModal");
  if (unitModalEl) unitModalEl.addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
  if (deleteModalEl) deleteModalEl.addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });

  // ==============================
  // CRUD
  // ==============================
  async function fetchUnits() {
    try {
      const res = await fetch(`${BACKEND_URL}/unidades`, {
        headers: { Authorization: token }
      });

      if (!res.ok) throw new Error("Erro ao carregar unidades.");
      units = await res.json();
      renderUnits(units);
      updateStats(units);
    } catch (err) {
      console.error(err);
      showAlertMain("Erro ao buscar unidades.", "error");
    }
  }

  function validateUnitForm() {
    let valid = true;

    const fields = [
      { id: "unitName", message: "Nome da unidade é obrigatório." },
      { id: "unitCode", message: "Código da unidade é obrigatório." },
      { id: "cep", message: "CEP é obrigatório." },
      { id: "numero", message: "Número é obrigatório." }
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const span = input?.parentElement.querySelector(".error-message");

      if (!input.value.trim()) {
        valid = false;
        span.textContent = f.message;
        span.style.display = "block";
        input.classList.add("input-error");
      } else {
        span.textContent = "";
        span.style.display = "none";
        input.classList.remove("input-error");
      }
    });
    return valid;
  }

  async function saveUnit(e) {
    e.preventDefault();

    if (!validateUnitForm()) {
      return;
    }
    try {
      const method = currentEditId ? "PUT" : "POST";
      const url = `${BACKEND_URL}/unidades`;

      const data = {
        id: currentEditId || undefined,
        nome: document.getElementById("unitName").value,
        codigoAcesso: document.getElementById("unitCode").value,
        endereco: {
          cep: document.getElementById("cep").value,
          numero: document.getElementById("numero").value,
        },
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(await res.text());

      showAlertMain(
        currentEditId ? "Unidade atualizada com sucesso!" : "Unidade cadastrada com sucesso!",
        "success"
      );

      closeModal();
      await fetchUnits();
    } catch (err) {
      console.error("Erro ao salvar unidade:", err);
      showAlert("Erro ao salvar unidade.", "error");
    }
  }

  async function editUnit(id) {
    const unit = units.find(u => u.id === id);
    if (!unit) return;

    currentEditId = id;

    const modalTitle = document.getElementById("modalTitle");
    const unitModal = document.getElementById("unitModal");

    document.getElementById("unitName").value = unit.nome || "";
    document.getElementById("unitCode").value = unit.codigoAcesso || "";
    document.getElementById("cep").value = unit.endereco?.cep || "";
    document.getElementById("numero").value = unit.endereco?.numero || "";

    if (modalTitle) modalTitle.textContent = "Editar Unidade";
    if (unitModal) unitModal.classList.add("active");
  }

  function deleteUnit(id) {
    currentDeleteId = id;
    const deleteModal = document.getElementById("deleteModal");
    if (deleteModal) deleteModal.classList.add("active");
  }

  async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/unidades/${currentDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      if (!res.ok) {
        let msg = "Erro ao excluir unidade.";

        try {
          const data = await res.json();
          if (data.message) msg = data.message;
        } catch (e) {
          msg = await res.text();
        }

        showAlertMain(msg, "error");
        return;
      }

      showAlertMain("Unidade excluída com sucesso!", "success");
      closeModal();
      await fetchUnits();
    } catch (err) {
      console.error("Erro ao excluir unidade:", err);
      showAlert("Erro ao excluir unidade.", "error");
    }
  }

  // ==============================
  // Busca CEP
  // ==============================
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("blur", async () => {
      const cep = cepInput.value.replace(/\D/g, "");
      if (cep.length < 8) {
        showAlert("CEP inválido!", "error");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/endereco/${cep}`, {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("CEP não encontrado.");

        const endereco = await res.json();
        document.getElementById("logradouro").value = endereco.logradouro || "";
        document.getElementById("bairro").value = endereco.bairro || "";
        document.getElementById("cidade").value = endereco.cidade || "";
        document.getElementById("estado").value = endereco.estado || "";

        showAlert("Endereço encontrado!", "success");
      } catch (err) {
        console.error("Erro no CEP:", err);
        showAlert("Erro ao buscar CEP!", "error");
      }
    });
  }

  // ==============================
  // Renderização
  // ==============================
  function renderUnits(unitsToRender = []) {
    const tbody = document.getElementById("unitsTableBody");
    const emptyState = document.getElementById("emptyState");
    if (!tbody) return;

    if (unitsToRender.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = unitsToRender
      .map(
        (unit) => `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-smooth">
          <td class="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-normal">${unit.nome}</td>
          <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 font-normal">${unit.codigoAcesso}</td>
          <td class="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-normal">${unit.endereco?.cep || "-"}</td>
          <td class="py-4 px-4">
            <div class="table-actions">
              <button class="btn-icon" onclick="UnitsModule.editUnit(${unit.id})" title="Editar Unidade">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                  </path>
                </svg>
              </button>
              <button class="btn-icon" onclick="UnitsModule.deleteUnit(${unit.id})" title="Excluir Unidade">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                  </path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join("");
  }

  function updateStats() {
    const totalUnitsEl = document.getElementById("totalUnits");
    if (totalUnitsEl) totalUnitsEl.textContent = units.length || 0;
  }

  // ==============================
  // Inicialização
  // ==============================
  function initUnitsSection() {
    token = getAuthToken();
    if (!token) return;

    const addUnitBtn = document.getElementById("addUnitBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const unitForm = document.getElementById("unitForm");

    if (addUnitBtn) addUnitBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
    if (unitForm) unitForm.addEventListener("submit", saveUnit);

    fetchUnits();
  }

  return {
    initUnitsSection,
    editUnit,
    deleteUnit,
    openAddModal,
  };
})();
