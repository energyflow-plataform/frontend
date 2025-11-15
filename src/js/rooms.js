/**
 * rooms.js — Versão integrada com backend real (Spring Boot)
 *
 * Responsável por gerenciar Ambientes:
 *  - Buscar, cadastrar, editar e excluir ambientes.
 *  - Atualizar tabela e preencher unidades no select.
 */

const RoomsModule = (() => {
  const BACKEND_URL = "http://localhost:8080/api";

  // ==============================
  // Estado
  // ==============================
  let rooms = [];
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
    const modalTitle = document.getElementById("roomModalTitle");
    const roomForm = document.getElementById("roomForm");
    const roomModal = document.getElementById("roomModal");

    if (modalTitle) modalTitle.textContent = "Novo Ambiente";
    if (roomForm) roomForm.reset();
    if (roomModal) roomModal.classList.add("active");

    populateUnitSelect();
  }

  function closeModal() {
    document.querySelectorAll(".modal.active").forEach((el) =>
      el.classList.remove("active")
    );
  }

  const roomModalEl = document.getElementById("roomModal");
  const deleteModalEl = document.getElementById("deleteRoomModal");
  if (roomModalEl)
    roomModalEl.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  if (deleteModalEl)
    deleteModalEl.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

  // ==============================
  // CRUD
  // ==============================
  async function fetchRooms() {
    try {
      const res = await fetch(`${BACKEND_URL}/ambientes`, {
        headers: { Authorization: token },
      });

      if (!res.ok) throw new Error("Erro ao carregar ambientes.");
      rooms = await res.json();
      renderRooms(rooms);
      updateStats();
    } catch (err) {
      console.error(err);
      showAlertMain("Erro ao buscar ambientes.", "error");
    }
  }

  async function fetchUnits() {
    try {
      const res = await fetch(`${BACKEND_URL}/unidades`, {
        headers: { Authorization: token },
      });
      if (!res.ok) throw new Error("Erro ao carregar unidades.");
      units = await res.json();
    } catch (err) {
      console.error(err);
      showAlertMain("Erro ao buscar unidades.", "error");
    }
  }

  function populateUnitSelect() {
    const select = document.getElementById("roomUnit");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione uma unidade</option>';
    units.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.nome;
      select.appendChild(opt);
    });
  }

  async function saveRoom(e) {
    e.preventDefault();

    const data = {
      id: currentEditId || undefined,
      nome: document.getElementById("roomName").value,
      descricao: document.getElementById("roomDescription").value,
      unidade: { id: parseInt(document.getElementById("roomUnit").value) },
    };

    try {
      const method = currentEditId ? "PUT" : "POST";
      const url = `${BACKEND_URL}/ambientes`;

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
          ? "Ambiente atualizado com sucesso!"
          : "Ambiente cadastrado com sucesso!",
        "success"
      );

      closeModal();
      await fetchRooms();
    } catch (err) {
      console.error("Erro ao salvar ambiente:", err);
      showAlert("Erro ao salvar ambiente.", "error");
    }
  }

  async function editRoom(id) {
    const room = rooms.find((r) => r.id === id);
    if (!room) return;

    currentEditId = id;

    const modalTitle = document.getElementById("roomModalTitle");
    const roomModal = document.getElementById("roomModal");

    document.getElementById("roomName").value = room.nome || "";
    document.getElementById("roomDescription").value = room.descricao || "";
    populateUnitSelect();
    document.getElementById("roomUnit").value = room.unidade?.id || "";

    if (modalTitle) modalTitle.textContent = "Editar Ambiente";
    if (roomModal) roomModal.classList.add("active");
  }

  function deleteRoom(id) {
    currentDeleteId = id;
    const deleteModal = document.getElementById("deleteRoomModal");
    if (deleteModal) deleteModal.classList.add("active");
  }

  async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/ambientes/${currentDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      if (!res.ok) {
        let msg = "Erro ao excluir ambiente.";

        try {
          const data = await res.json();
          if (data.message) msg = data.message;
        } catch (e) {
          msg = await res.text();
        }

        showAlertMain(msg, "error");
        return;
      }

      showAlertMain("Ambiente excluído com sucesso!", "success");
      closeModal();
      await fetchRooms();
    } catch (err) {
      console.error("Erro ao excluir ambiente:", err);
      showAlertMain("Erro ao excluir ambiente.", "error");
    }
  }

  // ==============================
  // Renderização
  // ==============================
  function renderRooms(roomsToRender = []) {
    const tbody = document.getElementById("roomsTableBody");
    const emptyState = document.getElementById("emptyRoomsState");
    if (!tbody) return;

    if (roomsToRender.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = roomsToRender
      .map(
        (room) => `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-smooth">
          <td class="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-normal">${room.nome}</td>
          <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 font-normal">${room.descricao || "-"}</td>
          <td class="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-normal">${room.unidade?.nome || "-"}</td>
          <td class="py-4 px-4">
            <div class="table-actions">
              <button class="btn-icon" onclick="RoomsModule.editRoom(${room.id})" title="Editar Ambiente">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                  </path>
                </svg>
              </button>
              <button class="btn-icon" onclick="RoomsModule.deleteRoom(${room.id})" title="Excluir Ambiente">
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
    const totalRoomsEl = document.getElementById("totalRooms");
    if (totalRoomsEl) totalRoomsEl.textContent = rooms.length || 0;
  }

  // ==============================
  // Inicialização
  // ==============================
  async function initRoomsSection() {
    token = getAuthToken();
    if (!token) return;

    const addRoomBtn = document.getElementById("addRoomBtn");
    const closeModalBtn = document.getElementById("closeRoomModalBtn");
    const cancelBtn = document.getElementById("cancelRoomBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteRoomBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteRoomBtn");
    const roomForm = document.getElementById("roomForm");

    if (addRoomBtn) addRoomBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
    if (roomForm) roomForm.addEventListener("submit", saveRoom);

    await fetchUnits();
    await fetchRooms();
  }

  return {
    initRoomsSection,
    editRoom,
    deleteRoom,
    openAddModal,
  };
})();
