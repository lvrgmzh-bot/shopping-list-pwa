const SUPABASE_URL = "https://ejcpwxbojgopbrlvxdtc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqY3B3eGJvamdvcGJybHZ4ZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjQxODksImV4cCI6MjA5MzUwMDE4OX0.oOTPoSo2kOtgXBiRxMhDqzqUqXNQ7MEO3qlB8M045Kc";

const CATEGORIES = [
  "Frutas y verduras",
  "Carnes y pescados",
  "Lácteos",
  "Panadería",
  "Bebidas",
  "Limpieza",
  "Congelados",
  "Otros",
];

const state = {
  items: [],
  activeCategory: "Todas",
  loading: true,
};

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const itemForm = document.querySelector("#itemForm");
const itemInput = document.querySelector("#itemInput");
const categorySelect = document.querySelector("#categorySelect");
const shoppingList = document.querySelector("#shoppingList");
const emptyState = document.querySelector("#emptyState");
const filters = document.querySelector("#filters");
const pendingCount = document.querySelector("#pendingCount");
const connectionState = document.querySelector("#connectionState");
const refreshButton = document.querySelector("#refreshButton");

function boot() {
  renderCategories();
  renderFilters();
  bindEvents();
  loadItems();
  subscribeToChanges();
  registerServiceWorker();
}

function bindEvents() {
  itemForm.addEventListener("submit", handleAddItem);
  refreshButton.addEventListener("click", loadItems);
}

function renderCategories() {
  categorySelect.innerHTML = CATEGORIES.map(
    (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
  ).join("");
  categorySelect.value = "Otros";
}

function renderFilters() {
  const options = ["Todas", ...CATEGORIES];
  filters.innerHTML = options
    .map(
      (category) => `
        <button class="filter-chip" type="button" aria-pressed="${category === state.activeCategory}" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `,
    )
    .join("");

  filters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      renderFilters();
      renderItems();
    });
  });
}

async function loadItems() {
  connectionState.textContent = "Actualizando";

  const { data, error } = await db
    .from("shopping_list")
    .select("id,item,category,done,created_at")
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    connectionState.textContent = "Error";
    console.error(error);
    return;
  }

  state.items = data ?? [];
  state.loading = false;
  connectionState.textContent = "Sincronizada";
  renderItems();
}

async function handleAddItem(event) {
  event.preventDefault();
  const item = itemInput.value.trim();
  const category = categorySelect.value || "Otros";

  if (!item) return;

  itemForm.querySelector("button[type='submit']").disabled = true;

  const { error } = await db.from("shopping_list").insert({
    item,
    category,
    done: false,
  });

  itemForm.querySelector("button[type='submit']").disabled = false;

  if (error) {
    connectionState.textContent = "No se pudo añadir";
    console.error(error);
    return;
  }

  itemInput.value = "";
  itemInput.focus();
  await loadItems();
}

async function toggleItem(id, done) {
  const original = [...state.items];
  state.items = state.items.map((item) => (item.id === id ? { ...item, done: !done } : item));
  renderItems();

  const { error } = await db.from("shopping_list").update({ done: !done }).eq("id", id);

  if (error) {
    state.items = original;
    connectionState.textContent = "No se pudo guardar";
    renderItems();
    console.error(error);
  }
}

async function deleteItem(id) {
  const original = [...state.items];
  state.items = state.items.filter((item) => item.id !== id);
  renderItems();

  const { error } = await db.from("shopping_list").delete().eq("id", id);

  if (error) {
    state.items = original;
    connectionState.textContent = "No se pudo borrar";
    renderItems();
    console.error(error);
  }
}

function renderItems() {
  const visibleItems =
    state.activeCategory === "Todas"
      ? state.items
      : state.items.filter((item) => item.category === state.activeCategory);

  const pending = state.items.filter((item) => !item.done).length;
  pendingCount.textContent =
    pending === 1 ? "1 producto pendiente" : `${pending} productos pendientes`;

  emptyState.hidden = visibleItems.length > 0 || state.loading;
  shoppingList.innerHTML = visibleItems.map(renderItem).join("");

  shoppingList.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      toggleItem(button.dataset.id, button.dataset.done === "true");
    });
  });

  shoppingList.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteItem(button.dataset.id));
  });
}

function renderItem(row) {
  const date = row.created_at ? new Date(row.created_at).toLocaleDateString("es-ES") : "";
  const doneClass = row.done ? " done" : "";
  const checkLabel = row.done ? "Marcar como pendiente" : "Marcar como comprado";

  return `
    <li class="item-card${doneClass}">
      <button class="check-button" type="button" data-action="toggle" data-id="${row.id}" data-done="${row.done}" aria-label="${checkLabel}">
        ${row.done ? "✓" : ""}
      </button>
      <span class="item-main">
        <span class="item-name">${escapeHtml(row.item)}</span>
        <span class="item-meta">${escapeHtml(row.category || "Otros")}${date ? ` · ${date}` : ""}</span>
      </span>
      <button class="delete-button" type="button" data-action="delete" data-id="${row.id}" aria-label="Borrar ${escapeHtml(row.item)}">
        ×
      </button>
    </li>
  `;
}

function subscribeToChanges() {
  db.channel("shopping-list-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "shopping_list" }, loadItems)
    .subscribe((status) => {
      if (status === "SUBSCRIBED") connectionState.textContent = "Sincronizada";
    });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.info("Service worker no disponible en este entorno.", error);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot();
