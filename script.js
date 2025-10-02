// 🔑 Configuración Supabase
const SUPABASE_URL = "https://kjauubnikapfyfjhplye.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXV1Ym5pa2FwZnlmamhwbHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODA1OTEsImV4cCI6MjA3NDk1NjU5MX0.uJPC3W2GVSXqc6f_AGtUs5TbJGGfhAurDIeS0MsZrUY";
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

let currentUser = null;

// 🚀 Inicializar
window.onload = () => {
  fetchUsers();
  fetchDoors();
  fetchLogs();
  setInterval(fetchLogs, 5000); // refrescar historial cada 5 segundos
};

// =============================
// Usuarios
// =============================
async function fetchUsers() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, { headers });
    const users = await res.json();

    const userSelect = document.getElementById("userSelect");
    userSelect.innerHTML = "";
    users.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id; // UUID
      option.textContent = user.username;
      userSelect.appendChild(option);
    });

    currentUser = users[0]?.id || null;

    userSelect.addEventListener("change", (e) => {
      currentUser = e.target.value;
    });
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
  }
}

// =============================
// Puertas
// =============================
async function fetchDoors() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/doors`, { headers });
    const doors = await res.json();
    renderDoors(doors);
  } catch (error) {
    console.error("Error al cargar puertas:", error);
  }
}

function renderDoors(doors) {
  const container = document.getElementById("door-container");
  container.innerHTML = "";

  doors.forEach(door => {
    const div = document.createElement("div");
    div.className = "door";

    div.innerHTML = `
      <h3>${door.name}</h3>
      <div class="door-content">
        <p>Ubicación: ${door.location || "N/A"}</p>
        <p>Estado: <strong>${door.status}</strong></p>
      </div>
      <button>${door.status === "cerrada" ? "Abrir" : "Cerrar"}</button>
    `;

    div.querySelector("button").addEventListener("click", () => toggleDoor(door.id, div));
    container.appendChild(div);
  });
}

// =============================
// Abrir/Cerrar puerta y guardar log
// =============================
async function toggleDoor(doorId, doorDiv) {
  const estadoStrong = doorDiv.querySelector(".door-content p:nth-child(2) strong");
  const currentStatus = estadoStrong.textContent;
  const newStatus = currentStatus === "cerrada" ? "abierta" : "cerrada";

  if (!currentUser) {
    alert("Selecciona un usuario antes de abrir/cerrar la puerta.");
    return;
  }

  try {
    // Actualizar estado de la puerta
    await fetch(`${SUPABASE_URL}/rest/v1/doors?id=eq.${doorId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: newStatus })
    });

    // Guardar log
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        door_id: doorId,         // UUID
        user_id: currentUser,    // UUID
        action: newStatus === "abierta" ? "abrir" : "cerrar"
      })
    });

    // Actualizar DOM
    estadoStrong.textContent = newStatus;
    doorDiv.querySelector("button").textContent = newStatus === "cerrada" ? "Abrir" : "Cerrar";

    // Refrescar historial
    fetchLogs();
  } catch (error) {
    console.error("Error al actualizar puerta o guardar log:", error);
  }
}

// =============================
// Historial de accesos
// =============================
async function fetchLogs() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=20`, { headers });
    const logs = await res.json();

    if (!Array.isArray(logs)) {
      console.error("Respuesta inesperada:", logs);
      return;
    }

    const logBody = document.getElementById("log-body");
    logBody.innerHTML = logs.map(log => `
      <tr>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.user_id}</td>
        <td>${log.action}</td>
        <td>${log.door_id}</td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Error al cargar logs:", error);
  }
}