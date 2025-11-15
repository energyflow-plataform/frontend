/**
 * devices.js — Módulo completo integrado ao backend (Spring Boot)
 *
 * Responsável por gerenciar Dispositivos:
 *  - Buscar, cadastrar, editar e excluir dispositivos.
 *  - Atualizar tabela e estatísticas.
 *  - Carregar ambientes disponíveis no select.
 */

const DevicesModule = (() => {
  const BACKEND_URL = "http://localhost:8080/api";

  // ==============================
  // Estado
  // ==============================
  let devices = [];
  let currentEditId = null;
  let currentDeleteId = null;
  let token = null;

  // ==============================
  // Utilitários
  // ==============================
  function showAlert(message, type = "info") {
    const alertBox = document.getElementById("alert");
    if (!alertBox) {
      alert(`${type.toUpperCase()}: ${message}`);
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
    const modalTitle = document.getElementById("deviceModalTitle");
    const form = document.getElementById("deviceForm");
    const modal = document.getElementById("deviceModal");

    if (modalTitle) modalTitle.textContent = "Novo Dispositivo";
    if (form) form.reset();
    if (modal) modal.classList.add("active");
    carregarAmbientes();
  }

  function closeModal() {
    document.querySelectorAll(".modal.active").forEach(el => el.classList.remove("active"));
  }

  const deviceModalEl = document.getElementById("deviceModal");
  const deleteModalEl = document.getElementById("deleteModal");
  if (deviceModalEl) deviceModalEl.addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
  if (deleteModalEl) deleteModalEl.addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });

  // ==============================
  // CRUD
  // ==============================
  async function fetchDevices() {
    try {
      const res = await fetch(`${BACKEND_URL}/dispositivos`, {
        headers: { Authorization: token },
      });

      if (!res.ok) throw new Error("Erro ao carregar dispositivos.");
      devices = await res.json();
      renderDevices(devices);
      updateStats();
    } catch (err) {
      console.error(err);
      showAlertMain("Erro ao buscar dispositivos.", "error");
    }
  }

  async function saveDevice(e) {
    e.preventDefault();

    const data = {
      id: currentEditId || undefined,
      nome: document.getElementById("deviceName").value,
      tipo: document.getElementById("deviceType").value,
      potencia: parseFloat(document.getElementById("devicePower").value),
      status: document.getElementById("deviceStatus").value === "active",
      ambiente: { id: parseInt(document.getElementById("deviceRoom").value) },
    };

    try {
      const method = currentEditId ? "PUT" : "POST";
      const url = `${BACKEND_URL}/dispositivos`;

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
        currentEditId
          ? "Dispositivo atualizado com sucesso!"
          : "Dispositivo cadastrado com sucesso!",
        "success"
      );

      closeModal();
      await fetchDevices();
    } catch (err) {
      console.error("Erro ao salvar dispositivo:", err);
      showAlert("Erro ao salvar dispositivo.", "error");
    }
  }

  async function editDevice(id) {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    currentEditId = id;
    const modalTitle = document.getElementById("deviceModalTitle");
    const modal = document.getElementById("deviceModal");

    document.getElementById("deviceName").value = device.nome || "";
    document.getElementById("deviceType").value = device.tipo || "";
    document.getElementById("devicePower").value = device.potencia || "";
    document.getElementById("deviceStatus").value = device.status ? "active" : "inactive";

    await carregarAmbientes();
    document.getElementById("deviceRoom").value = device.ambiente?.id || "";

    if (modalTitle) modalTitle.textContent = "Editar Dispositivo";
    if (modal) modal.classList.add("active");
  }

  function deleteDevice(id) {
    currentDeleteId = id;
    const deleteModal = document.getElementById("deleteDeviceModal");
    if (deleteModal) deleteModal.classList.add("active");
  }

  async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/dispositivos/${currentDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      if (!res.ok) throw new Error(await res.text());

      showAlertMain("Dispositivo excluído com sucesso!", "success");
      closeModal();
      await fetchDevices();
    } catch (err) {
      console.error("Erro ao excluir dispositivo:", err);
      showAlertMain("Erro ao excluir dispositivo.", "error");
    }
  }

  // ==============================
  // Carregar Ambientes
  // ==============================
  async function carregarAmbientes() {
    const ambienteSelect = document.getElementById("deviceRoom");
    if (!ambienteSelect) return;
    ambienteSelect.innerHTML = `<option value="">Carregando...</option>`;

    try {
      const res = await fetch(`${BACKEND_URL}/ambientes`, {
        headers: { Authorization: token },
      });
      if (!res.ok) throw new Error("Erro ao buscar ambientes.");

      const ambientes = await res.json();
      ambienteSelect.innerHTML = `<option value="">Selecione...</option>`;
      ambientes.forEach(a => {
        const option = document.createElement("option");
        option.value = a.id;
        option.textContent = a.nome;
        ambienteSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
      ambienteSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
  }

  // ==============================
  // Renderização
  // ==============================
  function renderDevices(devicesToRender = []) {
    const tbody = document.getElementById("devicesTableBody");
    const emptyState = document.getElementById("emptyDevicesState");
    if (!tbody) return;

    if (devicesToRender.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = devicesToRender
      .map(
        d => `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-smooth">
          <td class="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">${d.nome}</td>
          <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${d.tipo}</td>
          <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${d.potencia} W</td>
          <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${d.ambiente?.nome || "-"}</td>
          <td class="py-4 px-4 text-sm ${d.status ? "text-green-500" : "text-red-500"} font-semibold">
            ${d.status ? "Ativo" : "Inativo"}
          </td>
          <td class="py-4 px-4">
            <div class="table-actions">
              <button class="btn-icon" onclick="DevicesModule.editDevice(${d.id})" title="Editar Dispositivo">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                  </path>
                </svg>
              </button>
              <button class="btn-icon" onclick="DevicesModule.deleteDevice(${d.id})" title="Excluir Dispositivo">
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
  const totalDevicesEl = document.getElementById("totalDevices");
  const activeDevicesEl = document.getElementById("activeDevices");
  const inactiveDevicesEl = document.getElementById("inactiveDevices");

  const total = devices.length;
  const active = devices.filter(d => d.status === true).length;
  const inactive = total - active;

    if (totalDevicesEl) totalDevicesEl.textContent = total;
    if (activeDevicesEl) activeDevicesEl.textContent = active;
    if (inactiveDevicesEl) inactiveDevicesEl.textContent = inactive;
  }

  // ==============================
  // Inicialização
  // ==============================
  function initDevicesSection() {
    token = getAuthToken();
    if (!token) return;

    const addBtn = document.getElementById("addDeviceBtn");
    const closeModalBtn = document.getElementById("closeDeviceModalBtn");
    const cancelBtn = document.getElementById("cancelDeviceBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteDeviceBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteDeviceBtn");
    const form = document.getElementById("deviceForm");

    if (addBtn) addBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
    if (form) form.addEventListener("submit", saveDevice);

    fetchDevices();
  }

  return {
    initDevicesSection,
    editDevice,
    deleteDevice,
    openAddModal,
  };
})();