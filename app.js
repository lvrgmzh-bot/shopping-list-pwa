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

const CATEGORY_META = {
  "Frutas y verduras": { emoji: "🥬", aisle: "Frescos" },
  "Carnes y pescados": { emoji: "🥩", aisle: "Carne y pescado" },
  Lácteos: { emoji: "🥛", aisle: "Lácteos y huevos" },
  Panadería: { emoji: "🥖", aisle: "Pan y bollería" },
  Bebidas: { emoji: "🥤", aisle: "Bebidas" },
  Limpieza: { emoji: "🧽", aisle: "Droguería" },
  Congelados: { emoji: "❄️", aisle: "Congelados" },
  Otros: { emoji: "🛒", aisle: "Despensa" },
};

const PRODUCT_EMOJI_RULES = [
  { emoji: "🍎", words: ["manzana", "pera", "fruta", "ciruela"] },
  { emoji: "🍌", words: ["platano", "banana"] },
  { emoji: "🍊", words: ["naranja", "mandarina", "limon", "lima"] },
  { emoji: "🍓", words: ["fresa", "frambuesa", "arandanos"] },
  { emoji: "🥑", words: ["aguacate"] },
  { emoji: "🍅", words: ["tomate"] },
  { emoji: "🥔", words: ["patata", "boniato"] },
  { emoji: "🥕", words: ["zanahoria"] },
  { emoji: "🥬", words: ["lechuga", "rucula", "rúcula", "espinaca", "ensalada", "canonigos"] },
  { emoji: "🧅", words: ["cebolla", "ajo", "puerro"] },
  { emoji: "🌶️", words: ["pimiento"] },
  { emoji: "🥦", words: ["brocoli", "coliflor", "calabacin", "berenjena", "verdura"] },
  { emoji: "🥩", words: ["ternera", "vacuno", "filete", "carne", "chuleta"] },
  { emoji: "🍗", words: ["pollo", "pavo", "pechuga"] },
  { emoji: "🥓", words: ["bacon", "jamon", "chorizo", "embutido", "sobrasada"] },
  { emoji: "🐟", words: ["pescado", "salmon", "merluza", "atun", "bacalao", "sardina"] },
  { emoji: "🦐", words: ["gamba", "langostino", "marisco", "mejillones", "calamar", "sepia"] },
  { emoji: "🥛", words: ["leche", "kefir", "batido"] },
  { emoji: "🧀", words: ["queso", "quesitos", "mozzarella", "parmesano"] },
  { emoji: "🥚", words: ["huevo", "huevos"] },
  { emoji: "🍦", words: ["yogur", "yogures", "helado", "flan", "natillas"] },
  { emoji: "🥖", words: ["pan", "baguette", "barra", "hogaza"] },
  { emoji: "🥐", words: ["croissant", "bolleria", "magdalena", "donut", "bizcocho"] },
  { emoji: "🍪", words: ["galleta", "galletas"] },
  { emoji: "💧", words: ["agua"] },
  { emoji: "🥤", words: ["refresco", "cola", "cocacola", "fanta", "zumo", "aquarius"] },
  { emoji: "🍷", words: ["vino", "cava", "sangria", "sidra"] },
  { emoji: "🍺", words: ["cerveza"] },
  { emoji: "🧴", words: ["detergente", "suavizante", "lejia", "lavavajillas", "limpiador"] },
  { emoji: "🧻", words: ["papel higienico", "papel de cocina", "servilletas"] },
  { emoji: "🧽", words: ["bayeta", "estropajo", "guantes", "fregasuelos"] },
  { emoji: "🧊", words: ["hielo", "congelado", "congelada", "congelados"] },
  { emoji: "🍕", words: ["pizza"] },
  { emoji: "🍚", words: ["arroz", "pasta", "garbanzo", "lenteja", "alubia"] },
  { emoji: "☕", words: ["cafe", "infusion", "te", "cacao"] },
  { emoji: "🍫", words: ["chocolate", "caramelos", "azucar"] },
  { emoji: "🫒", words: ["aceite", "aceitunas", "vinagre"] },
  { emoji: "🥫", words: ["conserva", "caldo", "sopa", "salsa", "ketchup", "mayonesa"] },
];

const CATEGORY_RULES = [...(window.CATEGORY_CATALOG || [])].sort(
  (left, right) => right.priority - left.priority,
);

const state = {
  items: [],
  manualCategory: false,
  loading: true,
};

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const itemForm = document.querySelector("#itemForm");
const itemInput = document.querySelector("#itemInput");
const categorySelect = document.querySelector("#categorySelect");
const routeBoard = document.querySelector("#routeBoard");
const aisleStrip = document.querySelector("#aisleStrip");
const emptyState = document.querySelector("#emptyState");
const pendingCount = document.querySelector("#pendingCount");
const connectionState = document.querySelector("#connectionState");
const refreshButton = document.querySelector("#refreshButton");

function boot() {
  renderCategories();
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
    (category) => `<option value="${escapeHtml(category)}">${getCategoryEmoji(category)} ${escapeHtml(category)}</option>`,
  ).join("");
  categorySelect.value = "Otros";
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

  state.items = normalizeRows(data ?? []);
  state.loading = false;
  connectionState.textContent = "Sincronizada";
  renderShoppingRoute();
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
    connectionState.textContent = "No se pudo añadir";
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
  renderShoppingRoute();

  const { error } = await db.from("shopping_list").update({ done: !done }).eq("id", id);

  if (error) {
    state.items = original;
    connectionState.textContent = "No se pudo guardar";
    renderShoppingRoute();
    console.error(error);
  }
}

async function deleteItem(id) {
  const original = [...state.items];
  state.items = state.items.filter((item) => item.id !== id);
  renderShoppingRoute();

  const { error } = await db.from("shopping_list").delete().eq("id", id);

  if (error) {
    state.items = original;
    connectionState.textContent = "No se pudo borrar";
    renderShoppingRoute();
    console.error(error);
  }
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    ...row,
    category: CATEGORIES.includes(row.category) ? row.category : "Otros",
  }));
}

function renderShoppingRoute() {
  const pendingItems = state.items.filter((item) => !item.done);
  const doneItems = state.items.filter((item) => item.done);
  const pending = pendingItems.length;

  pendingCount.textContent = pending === 1 ? "1 producto pendiente" : `${pending} productos pendientes`;
  emptyState.hidden = state.items.length > 0 || state.loading;

  renderAisleStrip(pendingItems);
  renderRouteBoard(pendingItems, doneItems);
  bindItemActions();
}

function renderAisleStrip(pendingItems) {
  aisleStrip.innerHTML = CATEGORIES.map((category) => {
    const count = pendingItems.filter((item) => item.category === category).length;
    const isEmpty = count === 0;

    return `
      <a class="aisle-chip${isEmpty ? " empty" : ""}" href="#section-${slugify(category)}" aria-label="Ir a ${escapeHtml(category)}">
        <span class="aisle-icon" aria-hidden="true">${getCategoryEmoji(category)}</span>
        <span class="aisle-text">${escapeHtml(category)}</span>
        <span class="aisle-count">${count}</span>
      </a>
    `;
  }).join("");
}

function renderRouteBoard(pendingItems, doneItems) {
  routeBoard.innerHTML = CATEGORIES.map((category) => {
    const categoryPending = pendingItems.filter((item) => item.category === category);
    const categoryDone = doneItems.filter((item) => item.category === category);
    const total = categoryPending.length + categoryDone.length;
    const meta = CATEGORY_META[category] || CATEGORY_META.Otros;

    return `
      <section class="category-section${total === 0 ? " is-empty" : ""}" id="section-${slugify(category)}">
        <header class="category-header">
          <span class="category-emoji" aria-hidden="true">${meta.emoji}</span>
          <span class="category-title-block">
            <strong>${escapeHtml(category)}</strong>
            <small>${escapeHtml(meta.aisle)}</small>
          </span>
          <span class="category-total">${categoryPending.length}</span>
        </header>
        <div class="category-items">
          ${categoryPending.length > 0 ? categoryPending.map(renderItem).join("") : renderEmptyCategory(category)}
          ${categoryDone.length > 0 ? categoryDone.map(renderItem).join("") : ""}
        </div>
      </section>
    `;
  }).join("");
}

function renderEmptyCategory(category) {
  return `<div class="category-empty">${getCategoryEmoji(category)} Nada pendiente</div>`;
}

function renderItem(row) {
  const doneClass = row.done ? " done" : "";
  const checkLabel = row.done ? "Marcar como pendiente" : "Marcar como comprado";
  const itemEmoji = getItemEmoji(row.item, row.category);

  return `
    <article class="item-card${doneClass}">
      <button class="check-button" type="button" data-action="toggle" data-id="${row.id}" data-done="${row.done}" aria-label="${checkLabel}">
        <span aria-hidden="true">${row.done ? "✓" : ""}</span>
      </button>
      <span class="item-emoji" aria-hidden="true">${itemEmoji}</span>
      <span class="item-main">
        <span class="item-name">${escapeHtml(row.item)}</span>
        <span class="item-meta">${escapeHtml(row.category || "Otros")}</span>
      </span>
      <button class="delete-button" type="button" data-action="delete" data-id="${row.id}" aria-label="Borrar ${escapeHtml(row.item)}">
        ×
      </button>
    </article>
  `;
}

function bindItemActions() {
  routeBoard.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      toggleItem(button.dataset.id, button.dataset.done === "true");
    });
  });

  routeBoard.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteItem(button.dataset.id));
  });
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
  renderShoppingRoute();
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

function getItemEmoji(item, category) {
  const normalizedItem = normalizeText(item);
  const match = PRODUCT_EMOJI_RULES.find((rule) =>
    rule.words.some((word) => hasWordOrPhrase(normalizedItem, word)),
  );

  return match?.emoji || getCategoryEmoji(category);
}

function getCategoryEmoji(category) {
  return (CATEGORY_META[category] || CATEGORY_META.Otros).emoji;
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
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-");
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