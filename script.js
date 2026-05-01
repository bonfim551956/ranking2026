// ============================================================
// CONFIG
// ============================================================
const SHEET_ID = "1hAzsPEoartooj6i-9aq-aAu5xFzOKkBiuUwnao0-JnI";
const GID_CONSULTORES = "1717862999";
const GID_LOJAS = "0";

// ============================================================
// FETCH PLANILHA
// ============================================================
async function fetchSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const cols = json.table.cols.map((c) => c.label);
  return json.table.rows.map((row) => {
    const obj = {};
    row.c.forEach((cell, idx) => {
      obj[cols[idx] || `col${idx}`] = cell ? cell.v : "";
    });
    return obj;
  });
}

// ============================================================
// HELPERS
// ============================================================
function getPositionClass(index) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "";
}

function getPosLabel(index) {
  if (index === 0) return "🥇 1º";
  if (index === 1) return "🥈 2º";
  if (index === 2) return "🥉 3º";
  return `${index + 1}º`;
}

function formatPercent(value) {
  if (value === "" || value === null || value === undefined || isNaN(value)) return "-";
  return (Number(value) * 100).toFixed(1).replace(".", ",") + "%";
}

function getSavedPhoto(pos) {
  return localStorage.getItem(`idealize_photo_${pos}`) || "";
}

function savePhoto(pos, dataUrl) {
  localStorage.setItem(`idealize_photo_${pos}`, dataUrl);
}

function removePhoto(pos) {
  localStorage.removeItem(`idealize_photo_${pos}`);
}

// ============================================================
// PÓDIO TOP 3
// ============================================================
function renderPodium(top3) {
  const podium = document.getElementById("podium");
  podium.innerHTML = "";

  // Ordem visual: 2º | 1º | 3º
  const visualOrder = [1, 0, 2];

  visualOrder.forEach((dataIdx) => {
    const row = top3[dataIdx];
    if (!row) return;

    const posClass = getPositionClass(dataIdx);
    const nomeKey = Object.keys(row).find((k) => k.toLowerCase().includes("consultor")) || Object.keys(row)[0];
    const lojaKey = Object.keys(row).find((k) => k.toLowerCase().includes("loja")) || "";
    const percentKey = Object.keys(row).find((k) => k.toLowerCase().includes("%") || k.toLowerCase().includes("entrega")) || Object.keys(row)[2];

    const photo = getSavedPhoto(dataIdx);
    const heightClass = dataIdx === 0 ? "podium-first" : dataIdx === 1 ? "podium-second" : "podium-third";

    const item = document.createElement("div");
    item.className = `podium-item ${posClass} ${heightClass}`;
    item.style.animationDelay = `${dataIdx * 0.1}s`;

    item.innerHTML = `
      <div class="podium-avatar-wrap">
        ${photo
          ? `<img class="podium-avatar" src="${photo}" alt="${row[nomeKey]}" />`
          : `<div class="podium-avatar-placeholder">${(row[nomeKey] || "?")[0].toUpperCase()}</div>`
        }
        <div class="podium-medal medal-${posClass}">${dataIdx === 0 ? "🥇" : dataIdx === 1 ? "🥈" : "🥉"}</div>
      </div>
      <div class="podium-name">${row[nomeKey] || "-"}</div>
      <div class="podium-store">${row[lojaKey] || ""}</div>
      <div class="podium-pct">${formatPercent(row[percentKey])}</div>
      <div class="podium-base ${posClass}"></div>
    `;

    podium.appendChild(item);
  });
}

// ============================================================
// CONSULTORES (4º em diante)
// ============================================================
function renderConsultores(data) {
  const container = document.getElementById("consultores-list");
  container.innerHTML = "";

  const percentKey =
    Object.keys(data[0]).find((k) => k.toLowerCase().includes("%")) ||
    Object.keys(data[0]).find((k) => k.toLowerCase().includes("entrega")) || "col4";
  const nomeKey = Object.keys(data[0]).find((k) => k.toLowerCase().includes("consultor")) || "col0";
  const lojaKey = Object.keys(data[0]).find((k) => k.toLowerCase().includes("loja")) || "col1";
  const statusKey = Object.keys(data[0]).find((k) => k.toLowerCase().includes("status")) || "col5";

  const sorted = [...data].sort((a, b) => Number(b[percentKey] || 0) - Number(a[percentKey] || 0));

  // Top 3 vai pro pódio
  const top3 = sorted.slice(0, 3);
  renderPodium(top3);

  // 4º em diante ficam nos cards
  const rest = sorted.slice(3);

  if (rest.length === 0) {
    container.innerHTML = `<p class="rest-empty">Apenas os 3 primeiros colocados este período.</p>`;
    return;
  }

  rest.forEach((row, idx) => {
    const realIdx = idx + 3;
    const percent = Number(row[percentKey] || 0);
    const status = String(row[statusKey] || "").toLowerCase();

    const card = document.createElement("article");
    card.className = `card`;
    card.style.animationDelay = `${idx * 0.05}s`;

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${row[nomeKey] || "-"}</div>
          <div class="card-subtitle">${row[lojaKey] || ""}</div>
        </div>
        <div class="badge-pos">${realIdx + 1}º</div>
      </div>
      <div class="meta-row">
        <span>Entrega:</span>
        <span><strong>${formatPercent(row[percentKey])}</strong></span>
      </div>
      <div class="progress-wrapper">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${Math.min(140, Math.max(0, percent * 100))}%;"></div>
        </div>
      </div>
      <div class="status-chip ${percent >= 1 ? "status-ok" : "status-bad"}">${status || (percent >= 1 ? "bateu a meta" : "não bateu")}</div>
    `;

    container.appendChild(card);
  });
}

// ============================================================
// LOJAS
// ============================================================
function renderLojas(data) {
  const container = document.getElementById("lojas-list");
  container.innerHTML = "";

  const percentKey =
    Object.keys(data[0]).find((k) => k.toLowerCase().includes("%")) ||
    Object.keys(data[0]).find((k) => k.toLowerCase().includes("entrega")) || "col3";
  const lojaKey = Object.keys(data[0]).find((k) => k.toLowerCase().includes("loja")) || "col0";
  const statusKey = Object.keys(data[0]).find((k) => k.toLowerCase().includes("status")) || "col4";

  const sorted = [...data].sort((a, b) => Number(b[percentKey] || 0) - Number(a[percentKey] || 0));

  sorted.forEach((row, idx) => {
    const posClass = getPositionClass(idx);
    const posLabel = getPosLabel(idx);
    const percent = Number(row[percentKey] || 0);
    const status = String(row[statusKey] || "").toLowerCase();

    const card = document.createElement("article");
    card.className = `card ${posClass}`;
    card.style.animationDelay = `${idx * 0.05}s`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${row[lojaKey] || "-"}</div>
        <div class="badge-pos ${posClass}">${posLabel}</div>
      </div>
      <div class="meta-row">
        <span>Entrega:</span>
        <span><strong>${formatPercent(row[percentKey])}</strong></span>
      </div>
      <div class="progress-wrapper">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${Math.min(140, Math.max(0, percent * 100))}%;"></div>
        </div>
      </div>
      <div class="status-chip ${percent >= 1 ? "status-ok" : "status-bad"}">${status || (percent >= 1 ? "meta batida" : "abaixo da meta")}</div>
    `;

    container.appendChild(card);
  });
}

// ============================================================
// ADMIN MODAL
// ============================================================
function initAdmin() {
  const overlay = document.getElementById("modalOverlay");
  const btnAdmin = document.getElementById("btnAdmin");
  const btnClose = document.getElementById("modalClose");

  btnAdmin.addEventListener("click", () => {
    overlay.classList.add("open");
    loadPreviewsFromStorage();
  });

  btnClose.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  // Upload de fotos
  document.querySelectorAll(".file-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const pos = parseInt(e.target.dataset.pos);
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        savePhoto(pos, dataUrl);
        updatePreview(pos, dataUrl);
        // Re-renderiza pódio se já tiver dados
        if (window._lastTop3) renderPodium(window._lastTop3);
      };
      reader.readAsDataURL(file);
    });
  });

  // Remover fotos
  document.querySelectorAll(".btn-remove-photo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pos = parseInt(btn.dataset.pos);
      removePhoto(pos);
      updatePreview(pos, "");
      if (window._lastTop3) renderPodium(window._lastTop3);
    });
  });

  // Copiar URL webhook
  document.getElementById("btnCopyUrl").addEventListener("click", () => {
    const url = document.getElementById("webhookUrl").textContent;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById("btnCopyUrl");
      btn.textContent = "✅ Copiado!";
      setTimeout(() => (btn.textContent = "📋 Copiar"), 2000);
    });
  });

  // Salvar plataforma
  document.getElementById("btnSavePlatform").addEventListener("click", () => {
    const name = document.getElementById("platformName").value.trim();
    if (!name) return;
    localStorage.setItem("idealize_platform", name);
    alert(`Plataforma "${name}" salva! Informe ao suporte para gerar a integração específica.`);
  });

  // Preencher nome salvo
  const saved = localStorage.getItem("idealize_platform");
  if (saved) document.getElementById("platformName").value = saved;

  // Simular webhook
  document.getElementById("btnSimulate").addEventListener("click", simulateWebhook);
}

function updatePreview(pos, src) {
  const img = document.getElementById(`preview-${pos}`);
  const placeholder = img.nextElementSibling;
  if (src) {
    img.src = src;
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.src = "";
    img.style.display = "none";
    placeholder.style.display = "flex";
  }
}

function loadPreviewsFromStorage() {
  [0, 1, 2].forEach((pos) => {
    const photo = getSavedPhoto(pos);
    updatePreview(pos, photo);
  });
}

// ============================================================
// SIMULAÇÃO WEBHOOK
// ============================================================
function simulateWebhook() {
  const log = document.getElementById("webhookLog");
  const names = ["Ana Lima", "Carlos Souza", "Maria Oliveira", "João Pedro"];
  const stores = ["Loja Centro", "Loja Santos", "Loja Cubatão"];
  const name = names[Math.floor(Math.random() * names.length)];
  const store = stores[Math.floor(Math.random() * stores.length)];
  const value = (Math.random() * 2000 + 200).toFixed(2);
  const now = new Date().toLocaleTimeString("pt-BR");

  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `<span class="log-time">${now}</span> <strong>${name}</strong> (${store}) — R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const empty = log.querySelector(".log-empty");
  if (empty) empty.remove();

  log.prepend(entry);

  // Máximo 8 entradas
  while (log.children.length > 8) log.removeChild(log.lastChild);
}

// ============================================================
// INIT
// ============================================================
async function init() {
  initAdmin();

  try {
    const [consultores, lojas] = await Promise.all([
      fetchSheet(GID_CONSULTORES),
      fetchSheet(GID_LOJAS),
    ]);

    if (consultores && consultores.length) {
      renderConsultores(consultores);
    }
    if (lojas && lojas.length) {
      renderLojas(lojas);
    }

    // Atualiza a cada 5 minutos
    setInterval(async () => {
      const [c, l] = await Promise.all([
        fetchSheet(GID_CONSULTORES),
        fetchSheet(GID_LOJAS),
      ]);
      if (c && c.length) renderConsultores(c);
      if (l && l.length) renderLojas(l);
    }, 5 * 60 * 1000);

  } catch (e) {
    console.error(e);
    alert("Erro ao carregar dados do ranking. Confira se a planilha está pública.");
  }
}

init();
