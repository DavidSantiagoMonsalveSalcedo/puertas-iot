// 🔑 Configuración Supabase
const SUPABASE_URL = "https://kjauubnikapfyfjhplye.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYXV1Ym5pa2FwZnlmamhwbHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODA1OTEsImV4cCI6MjA3NDk1NjU5MX0.uJPC3W2GVSXqc6f_AGtUs5TbJGGfhAurDIeS0MsZrUY"; // truncado
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

// Variables globales
let currentUser = null;

// 🚀 Cargar usuarios y puertas al inicio
window.onload = () => {
  fetchUsers();
  fetchDoors();
};

// =============================
// 📌 Obtener y mostrar usuarios
// =============================
async function fetchUsers() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, { headers });
    const users = await res.json();

    const userSelect = document.getElementById("userSelect");
    userSelect.innerHTML = "";
    users.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.username} (${user.role})`;
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
// 📌 Obtener y mostrar puertas
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

// =============================
// 📌 Renderizar puertas
// =============================
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

    const button = div.querySelector("button");
    button.addEventListener("click", () => toggleDoor(door.id, div));

    container.appendChild(div);
  });
}

// =============================
// 📌 Abrir / Cerrar puerta
// =============================
async function toggleDoor(id, doorDiv) {
  const estadoStrong = doorDiv.querySelector(".door-content p:nth-child(2) strong");
  const currentStatus = estadoStrong.textContent;
  const newStatus = currentStatus === "cerrada" ? "abierta" : "cerrada";

  try {
    // Actualizar estado en Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/doors?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: newStatus })
    });

    // Guardar log en logs
    if (currentUser) {
      await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          door_id: id,
          user_id: currentUser,
          action: newStatus === "abierta" ? "abrir" : "cerrar"
        })
      });
    }

    // Actualizar DOM
    estadoStrong.textContent = newStatus;
    doorDiv.querySelector("button").textContent = newStatus === "cerrada" ? "Abrir" : "Cerrar";

  } catch (error) {
    console.error("Error al actualizar la puerta:", error);
  }
}