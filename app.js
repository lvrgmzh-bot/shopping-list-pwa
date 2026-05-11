const SUPABASE_URL = "https://ejcpwxbojgopbrlvxdtc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqY3B3eGJvamdvcGJybHZ4ZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjQxODksImV4cCI6MjA5MzUwMDE4OX0.oOTPoSo2kOtgXBiRxMhDqzqUqXNQ7MEO3qlB8M045Kc";

const CATEGORIES = [
  "Frutas y verduras",
  "Carnes y pescados",
  "L\u00e1cteos",
  "Panader\u00eda",
  "Bebidas",
  "Limpieza",
  "Congelados",
  "Otros",
];

const CATEGORY_RULES = [
  {
    category: "Congelados",
    words: [
      "congelado",
      "congelada",
      "helado",
      "helados",
      "hielo",
      "pizza congelada",
      "verdura congelada",
      "croquetas",
      "nuggets",
    ],
  },
  {
    category: "Limpieza",
    words: [
      "lejia",
      "detergente",
      "suavizante",
      "lavavajillas",
      "lavaplatos",
      "fregasuelos",
      "limpiacristales",
      "desinfectante",
      "estropajo",
      "bayeta",
      "papel higienico",
      "papel de cocina",
      "servilletas",
      "bolsas basura",
      "bolsas de basura",
    ],
  },
  {
    category: "Frutas y verduras",
    words: [
      "aguacate",
      "ajo",
      "ajos",
      "alcachofa",
      "apio",
      "banana",
      "berenjena",
      "brocoli",
      "calabacin",
      "calabaza",
      "cebolla",
      "cebollas",
      "champi\u00f1on",
      "champi\u00f1ones",
      "ciruela",
      "coliflor",
      "espinaca",
      "espinacas",
      "fresa",
      "fresas",
      "fruta",
      "kiwi",
      "lechuga",
      "limon",
      "limones",
      "mandarina",
      "mandarinas",
      "manzana",
      "manzanas",
      "melon",
      "naranja",
      "naranjas",
      "patata",
      "patatas",
      "pepino",
      "pera",
      "peras",
      "pimiento",
      "pimientos",
      "platano",
      "platanos",
      "puerro",
      "rucula",
      "tomate",
      "tomates",
      "uva",
      "uvas",
      "verdura",
      "verduras",
      "zanahoria",
      "zanahorias",
    ],
  },
  {
    category: "Carnes y pescados",
    words: [
      "atun",
      "bacalao",
      "bacon",
      "bonito",
      "carne",
      "cerdo",
      "chorizo",
      "chuleta",
      "filete",
      "filetes",
      "hamburguesa",
      "jamon",
      "lomo",
      "longaniza",
      "merluza",
      "pavo",
      "pescado",
      "pollo",
      "salchicha",
      "salmon",
      "sardina",
      "ternera",
    ],
  },
  {
    category: "L\u00e1cteos",
    words: [
      "batido",
      "mantequilla",
      "leche",
      "queso",
      "quesitos",
      "yogur",
      "yogures",
      "yogurt",
      "nata",
      "kefir",
      "cuajada",
    ],
  },
  {
    category: "Panader\u00eda",
    words: [
      "baguette",
      "barra",
      "bizcocho",
      "bolleria",
      "bollo",
      "brioche",
      "croissant",
      "donut",
      "empanada",
      "galleta",
      "galletas",
      "magdalena",
      "magdalenas",
      "pan",
      "pan de molde",
      "tostadas",
    ],
  },
  {
    category: "Bebidas",
    words: [
      "agua",
      "cerveza",
      "cocacola",
      "coca cola",
      "cola",
      "fanta",
      "gaseosa",
      "refresco",
      "refrescos",
      "sidra",
      "vino",
      "zumo",
      "zumos",
    ],
  },
];

const state = {
  items: [],
  activeCategory: "Todas",
  manualCategory: false,
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
  itemInput.addEventListener("input", updateSuggestedCategory);
  categorySelect.addEventListener("change", () => {
    state.manualCategory = true;
  });
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
  autoCategorizeIncomingItems();
}

async function handleAddItem(event) {
  event.preventDefault();
  const item = itemInput.value.trim();
  const category = state.manualCategory ? categorySelect.value : classifyItem(item);

  if (!item) return;

  itemForm.querySelector("button[type='submit']").disabled = true;

  const { error } = await db.from("shopping_list").insert({
    item,
    category,
    done: false,
  });

  itemForm.querySelector("button[type='submit']").disabled = false;

  if (error) {
    connectionState.textContent = "No se pudo a\u00f1adir";
    console.error(error);
    return;
  }

  itemInput.value = "";
  categorySelect.value = "Otros";
  state.manualCategory = false;
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
        <span class="item-meta">${escapeHtml(row.category || "Otros")}${date ? ` \u00b7 ${date}` : ""}</span>
      </span>
      <button class="delete-button" type="button" data-action="delete" data-id="${row.id}" aria-label="Borrar ${escapeHtml(row.item)}">
        ×
      </button>
    </li>
  `;
}

function updateSuggestedCategory() {
  if (state.manualCategory) return;
  categorySelect.value = classifyItem(itemInput.value);
}

async function autoCategorizeIncomingItems() {
  const itemsToUpdate = state.items
    .map((item) => ({ ...item, suggestedCategory: classifyItem(item.item) }))
    .filter(
      (item) =>
        item.suggestedCategory !== "Otros" &&
        (!item.category || item.category === "Otros") &&
        item.category !== item.suggestedCategory,
    );

  if (itemsToUpdate.length === 0) return;

  connectionState.textContent = "Clasificando";

  await Promise.all(
    itemsToUpdate.map((item) =>
      db.from("shopping_list").update({ category: item.suggestedCategory }).eq("id", item.id),
    ),
  );

  state.items = state.items.map((item) => {
    const updated = itemsToUpdate.find((candidate) => candidate.id === item.id);
    return updated ? { ...item, category: updated.suggestedCategory } : item;
  });

  connectionState.textContent = "Sincronizada";
  renderItems();
}

function classifyItem(item) {
  const normalizedItem = normalizeText(item);
  if (!normalizedItem) return "Otros";

  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((word) => hasWordOrPhrase(normalizedItem, word))) {
      return rule.category;
    }
  }

  return "Otros";
}

function hasWordOrPhrase(normalizedItem, word) {
  const normalizedWord = normalizeText(word);
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedWord)}($|\\s)`).test(normalizedItem);
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u00f1\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
