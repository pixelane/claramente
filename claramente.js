(function () {
  "use strict";

  const moneyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  });

  const screens = ["start", "people", "type", "products", "payer", "result"];
  const progress = {
    start: "Inicio",
    people: "1 de 5",
    type: "2 de 5",
    products: "3 de 5",
    payer: "4 de 5",
    result: "5 de 5"
  };

  const state = {
    screen: "start",
    people: [],
    products: [],
    payerMode: "",
    payerId: "",
    editing: null
  };

  const els = {
    root: document.getElementById("screenRoot"),
    backBtn: document.getElementById("backBtn"),
    progressLabel: document.getElementById("progressLabel"),
    sheet: document.getElementById("editSheet"),
    editForm: document.getElementById("editForm"),
    sheetTitle: document.getElementById("sheetTitle"),
    sheetBody: document.getElementById("sheetBody"),
    sheetActions: document.getElementById("sheetActions"),
    closeSheetBtn: document.getElementById("closeSheetBtn"),
    toast: document.getElementById("toast")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.backBtn.addEventListener("click", goBack);
    els.closeSheetBtn.addEventListener("click", closeSheet);
    els.editForm.addEventListener("submit", saveEdit);
    els.root.addEventListener("click", handleRootClick);
    els.root.addEventListener("submit", handleRootSubmit);
    render();
  }

  function render() {
    els.progressLabel.textContent = progress[state.screen];
    els.backBtn.hidden = state.screen === "start";

    const renderer = {
      start: renderStart,
      people: renderPeople,
      type: renderType,
      products: renderProducts,
      payer: renderPayer,
      result: renderResult
    }[state.screen];

    els.root.innerHTML = renderer();
    focusFirstField();
  }

  function renderHeader(title, help = "", kicker = "claramente") {
    return `
      <div>
        <p class="screen-kicker">${escapeHtml(kicker)}</p>
        <h1 class="screen-title">${escapeHtml(title)}</h1>
        ${help ? `<p class="screen-help">${escapeHtml(help)}</p>` : ""}
      </div>
    `;
  }

  function renderStart() {
    return `
      ${renderHeader("Vamos a dividir la cuenta", "No necesitas registrarte. Todo queda en este celular.")}
      <div class="panel">
        <button class="primary-button" type="button" data-go="people">Empezar</button>
        <button class="secondary-button" type="button" data-toast="Abrir cuenta guardada queda para una siguiente prueba.">Abrir cuenta guardada</button>
      </div>
    `;
  }

  function renderPeople() {
    const canContinue = state.people.length >= 2;
    return `
      ${renderHeader("Quienes estan en la mesa?", "Agrega una persona a la vez.")}
      <form class="panel form-grid" id="personForm" novalidate>
        <label class="field">
          <span>Nombre</span>
          <input id="personNameInput" name="personName" type="text" autocomplete="off" placeholder="Ana">
        </label>
        <p class="error-text" id="peopleError"></p>
        <button class="primary-button" type="submit">Agregar</button>
      </form>
      <div class="list" aria-label="Personas agregadas">
        ${state.people.length ? state.people.map(renderPersonCard).join("") : `<div class="empty-state">Agrega a quienes estan en la mesa.</div>`}
      </div>
      <div class="sticky-actions">
        <button class="primary-button" type="button" data-go="type" ${canContinue ? "" : "disabled"}>${canContinue ? "Ya estan todos" : "Agrega al menos a dos personas"}</button>
      </div>
    `;
  }

  function renderPersonCard(person) {
    return `
      <article class="person-card">
        <span class="initial" aria-hidden="true">${escapeHtml(initialFor(person.name))}</span>
        <div class="card-main">
          <h2 class="card-title">${escapeHtml(person.name)}</h2>
          <p class="card-meta">Persona en la mesa</p>
        </div>
        <div class="card-actions">
          <button class="mini-button" type="button" data-edit-person="${person.id}">Editar</button>
          <button class="mini-button mini-danger" type="button" data-remove-person="${person.id}">Quitar</button>
        </div>
      </article>
    `;
  }

  function renderType() {
    return `
      ${renderHeader("Que van a dividir?", "Elige el camino que mas se parece a tu cuenta.")}
      <div class="list">
        <button class="choice-card" type="button" data-go="products">
          <strong>Productos de la cuenta</strong>
          <span>Tacos, pizza, refrescos</span>
        </button>
        <button class="choice-card" type="button" data-toast="Gasto para todos entra en la siguiente version del prototipo.">
          <strong>Gasto para todos</strong>
          <span>Propina, taxi, botella</span>
        </button>
        <button class="choice-card" type="button" data-toast="Gasto de una persona entra en la siguiente version del prototipo.">
          <strong>Gasto de una persona</strong>
          <span>Un cafe, un extra, estacionamiento</span>
        </button>
      </div>
    `;
  }

  function renderProducts() {
    const canContinue = state.products.length > 0 && state.products.every((product) => product.eatenBy.length > 0);
    return `
      ${renderHeader("Que producto aparece en la cuenta?", "Agrega un producto, elige quien lo comio y sigue con el siguiente.")}
      <form class="panel form-grid" id="productForm" novalidate>
        <label class="field">
          <span>Producto</span>
          <input id="productNameInput" name="productName" type="text" autocomplete="off" placeholder="Pizza">
        </label>
        <label class="field">
          <span>Precio</span>
          <input id="productPriceInput" name="productPrice" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
        </label>
        <p class="error-text" id="productError"></p>
        <button class="primary-button" type="submit">Agregar producto</button>
      </form>
      <section class="list" aria-label="Productos agregados">
        ${state.products.length ? state.products.map(renderProductCard).join("") : `<div class="empty-state">Agrega el primer producto de la cuenta.</div>`}
      </section>
      <div class="sticky-actions">
        <button class="primary-button" type="button" data-go="payer" ${canContinue ? "" : "disabled"}>${canContinue ? "Ya termine la cuenta" : "Falta elegir quien comio"}</button>
      </div>
    `;
  }

  function renderProductCard(product) {
    const eaterNames = product.eatenBy.map(personName).join(", ");
    const missing = product.eatenBy.length === 0;
    return `
      <article class="product-card">
        <div>
          <h2 class="card-title">${escapeHtml(product.name)}</h2>
          <p class="money">${formatMoney(product.priceCents)}</p>
          <p class="card-meta">${missing ? "Elige quien comio esto" : `Lo comieron: ${escapeHtml(eaterNames)}`}</p>
        </div>
        ${missing ? `<div class="product-warning">Elige quien comio esto para seguir.</div>` : ""}
        <div class="person-picker" aria-label="Quien comio ${escapeHtml(product.name)}">
          ${state.people.map((person) => renderPickButton(person, product)).join("")}
          <button class="pick-button" type="button" data-product-all="${product.id}">Todos comieron esto</button>
        </div>
        <div class="card-actions">
          <button class="mini-button" type="button" data-edit-product="${product.id}">Editar</button>
          <button class="mini-button" type="button" data-duplicate-product="${product.id}">Duplicar</button>
          <button class="mini-button mini-danger" type="button" data-remove-product="${product.id}">Quitar</button>
        </div>
      </article>
    `;
  }

  function renderPickButton(person, product) {
    const active = product.eatenBy.includes(person.id);
    return `<button class="pick-button ${active ? "active" : ""}" type="button" data-toggle-eater="${product.id}:${person.id}">${escapeHtml(person.name)}</button>`;
  }

  function renderPayer() {
    const canContinue = state.payerMode === "none" || (state.payerMode === "single" && state.payerId);
    return `
      ${renderHeader("Alguien ya pago la cuenta?", "Elige como se pago para calcular el resultado.")}
      <div class="list">
        <button class="choice-card ${state.payerMode === "none" ? "active" : ""}" type="button" data-payer-mode="none">
          <strong>Todavia nadie pago</strong>
          <span>Clara dira cuanto aporta cada persona.</span>
        </button>
        <button class="choice-card ${state.payerMode === "single" ? "active" : ""}" type="button" data-payer-mode="single">
          <strong>Una persona pago</strong>
          <span>Elige quien pago para calcular quien le devuelve.</span>
        </button>
      </div>
      ${state.payerMode === "single" ? renderPayerPeople() : ""}
      <button class="secondary-button" type="button" data-toast="Pagaron varias personas queda como flujo avanzado de la siguiente prueba.">Pagaron varias personas</button>
      <p class="error-text" id="payerError"></p>
      <div class="sticky-actions">
        <button class="primary-button" type="button" data-go="result" ${canContinue ? "" : "disabled"}>${canContinue ? "Calcular cuenta" : "Elige una opcion"}</button>
      </div>
    `;
  }

  function renderPayerPeople() {
    return `
      <section class="list" aria-label="Quien pago">
        ${state.people.map((person) => `
          <button class="payer-card ${state.payerId === person.id ? "active" : ""}" type="button" data-payer="${person.id}">
            <strong>${escapeHtml(person.name)}</strong>
            <span>Pago la cuenta</span>
          </button>
        `).join("")}
      </section>
    `;
  }

  function renderResult() {
    const result = calculateResult();
    return `
      ${renderHeader("Listo, asi queda la cuenta", result.mode === "none" ? "Cada quien aporta su parte." : "Estos son los pagos sugeridos.")}
      <section class="list">
        ${result.cards.map(renderResultCard).join("")}
      </section>
      <div class="panel">
        <button class="primary-button" type="button" data-share-whatsapp>Enviar por WhatsApp</button>
        <button class="secondary-button" type="button" data-copy-summary>Copiar resumen</button>
      </div>
      <div class="panel">
        <button class="secondary-button" type="button" data-go="people">Editar personas</button>
        <button class="secondary-button" type="button" data-go="products">Editar productos</button>
        <button class="secondary-button" type="button" data-go="payer">Editar quien pago</button>
      </div>
    `;
  }

  function renderResultCard(card) {
    return `
      <article class="result-card ${card.kind}">
        <strong>${escapeHtml(card.text)}</strong>
      </article>
    `;
  }

  function handleRootSubmit(event) {
    event.preventDefault();
    if (event.target.id === "personForm") addPerson(event.target);
    if (event.target.id === "productForm") addProduct(event.target);
  }

  function handleRootClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.go) return goTo(button.dataset.go);
    if (button.dataset.toast) return showToast(button.dataset.toast);
    if (button.dataset.editPerson) return openPersonEdit(button.dataset.editPerson);
    if (button.dataset.removePerson) return removePerson(button.dataset.removePerson);
    if (button.dataset.editProduct) return openProductEdit(button.dataset.editProduct);
    if (button.dataset.removeProduct) return removeProduct(button.dataset.removeProduct);
    if (button.dataset.duplicateProduct) return duplicateProduct(button.dataset.duplicateProduct);
    if (button.dataset.productAll) return selectAllEaters(button.dataset.productAll);
    if (button.dataset.toggleEater) {
      const [productId, personId] = button.dataset.toggleEater.split(":");
      return toggleEater(productId, personId);
    }
    if (button.dataset.payerMode) return setPayerMode(button.dataset.payerMode);
    if (button.dataset.payer) return setPayer(button.dataset.payer);
    if (button.hasAttribute("data-share-whatsapp")) return shareWhatsApp();
    if (button.hasAttribute("data-copy-summary")) return copySummary();
  }

  function addPerson(form) {
    const input = form.elements.personName;
    const name = sanitizeText(input.value, 40);
    const error = document.getElementById("peopleError");
    if (!name) {
      error.textContent = "Falta el nombre";
      input.focus();
      return;
    }
    if (state.people.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
      error.textContent = "Ese nombre ya esta en la mesa";
      input.focus();
      return;
    }
    state.people.push({ id: createId("p"), name });
    input.value = "";
    render();
  }

  function addProduct(form) {
    const nameInput = form.elements.productName;
    const priceInput = form.elements.productPrice;
    const name = sanitizeText(nameInput.value, 60);
    const priceCents = toCents(priceInput.value);
    const error = document.getElementById("productError");
    if (!name) {
      error.textContent = "Falta el producto";
      nameInput.focus();
      return;
    }
    if (priceCents <= 0) {
      error.textContent = "Ponle un precio";
      priceInput.focus();
      return;
    }
    state.products.push({
      id: createId("prod"),
      name,
      priceCents,
      eatenBy: []
    });
    nameInput.value = "";
    priceInput.value = "";
    render();
  }

  function goTo(screen) {
    if (!screens.includes(screen)) return;
    if (screen === "type" && state.people.length < 2) {
      showToast("Agrega al menos a dos personas para dividir.");
      return;
    }
    if (screen === "payer" && !productsReady()) {
      showToast("Elige quien comio cada producto.");
      return;
    }
    if (screen === "result" && !payerReady()) {
      showToast("Elige como se pago la cuenta.");
      return;
    }
    state.screen = screen;
    render();
  }

  function goBack() {
    const index = screens.indexOf(state.screen);
    if (index <= 0) return;
    state.screen = screens[index - 1];
    render();
  }

  function productsReady() {
    return state.products.length > 0 && state.products.every((product) => product.eatenBy.length > 0);
  }

  function payerReady() {
    return state.payerMode === "none" || (state.payerMode === "single" && state.payerId);
  }

  function openPersonEdit(personId) {
    const person = state.people.find((item) => item.id === personId);
    if (!person) return;
    state.editing = { type: "person", id: personId };
    openSheet("Editar persona", `
      <label class="field">
        <span>Nombre</span>
        <input name="personName" type="text" value="${escapeAttr(person.name)}" autocomplete="off">
      </label>
    `, `
      <button class="primary-button" type="submit">Guardar cambios</button>
      <button class="danger-button" type="button" data-sheet-remove>Quitar persona</button>
    `);
  }

  function openProductEdit(productId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    state.editing = { type: "product", id: productId };
    openSheet("Editar producto", `
      <label class="field">
        <span>Producto</span>
        <input name="productName" type="text" value="${escapeAttr(product.name)}" autocomplete="off">
      </label>
      <label class="field">
        <span>Precio</span>
        <input name="productPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${(product.priceCents / 100).toFixed(2)}">
      </label>
      <div class="field">
        <span>Quien comio esto</span>
        <div class="person-picker">
          ${state.people.map((person) => {
            const active = product.eatenBy.includes(person.id) ? "active" : "";
            return `<button class="pick-button ${active}" type="button" data-sheet-eater="${person.id}">${escapeHtml(person.name)}</button>`;
          }).join("")}
        </div>
      </div>
    `, `
      <button class="primary-button" type="submit">Guardar cambios</button>
      <button class="danger-button" type="button" data-sheet-remove>Eliminar producto</button>
    `);
  }

  function openSheet(title, body, actions) {
    els.sheetTitle.textContent = title;
    els.sheetBody.innerHTML = body;
    els.sheetActions.innerHTML = actions;
    els.sheetActions.querySelector("[data-sheet-remove]")?.addEventListener("click", removeEditingItem);
    els.sheetBody.querySelectorAll("[data-sheet-eater]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("active");
      });
    });
    els.sheet.showModal();
    window.setTimeout(() => els.sheetBody.querySelector("input")?.focus(), 0);
  }

  function closeSheet() {
    els.sheet.close();
    state.editing = null;
  }

  function saveEdit(event) {
    event.preventDefault();
    if (!state.editing) return;

    if (state.editing.type === "person") {
      const person = state.people.find((item) => item.id === state.editing.id);
      if (!person) return closeSheet();
      const name = sanitizeText(els.editForm.elements.personName.value, 40);
      if (!name) return showToast("Falta el nombre");
      person.name = name;
    }

    if (state.editing.type === "product") {
      const product = state.products.find((item) => item.id === state.editing.id);
      if (!product) return closeSheet();
      const name = sanitizeText(els.editForm.elements.productName.value, 60);
      const priceCents = toCents(els.editForm.elements.productPrice.value);
      if (!name) return showToast("Falta el producto");
      if (priceCents <= 0) return showToast("Ponle un precio");
      product.name = name;
      product.priceCents = priceCents;
      product.eatenBy = Array.from(els.sheetBody.querySelectorAll("[data-sheet-eater].active")).map((button) => button.dataset.sheetEater);
    }

    closeSheet();
    showToast("Listo, se actualizo");
    render();
  }

  function removeEditingItem() {
    if (!state.editing) return;
    if (state.editing.type === "person") removePerson(state.editing.id, true);
    if (state.editing.type === "product") removeProduct(state.editing.id, true);
    closeSheet();
  }

  function removePerson(personId, skipConfirm = false) {
    if (!skipConfirm && !confirm("Quitar a esta persona?")) return;
    state.people = state.people.filter((person) => person.id !== personId);
    state.products.forEach((product) => {
      product.eatenBy = product.eatenBy.filter((id) => id !== personId);
    });
    if (state.payerId === personId) state.payerId = "";
    render();
  }

  function removeProduct(productId, skipConfirm = false) {
    if (!skipConfirm && !confirm("Quitar este producto?")) return;
    state.products = state.products.filter((product) => product.id !== productId);
    render();
  }

  function duplicateProduct(productId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    state.products.push({
      id: createId("prod"),
      name: product.name,
      priceCents: product.priceCents,
      eatenBy: [...product.eatenBy]
    });
    showToast("Producto duplicado");
    render();
  }

  function toggleEater(productId, personId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    product.eatenBy = product.eatenBy.includes(personId)
      ? product.eatenBy.filter((id) => id !== personId)
      : [...product.eatenBy, personId];
    render();
  }

  function selectAllEaters(productId) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    product.eatenBy = state.people.map((person) => person.id);
    render();
  }

  function setPayerMode(mode) {
    state.payerMode = mode;
    if (mode === "none") state.payerId = "";
    render();
  }

  function setPayer(personId) {
    state.payerId = personId;
    render();
  }

  function calculateResult() {
    const contributions = calculateContributions();
    if (state.payerMode === "none") {
      return {
        mode: "none",
        cards: state.people
          .map((person) => ({
            kind: "owe",
            text: `${person.name} aporta ${formatMoney(contributions.get(person.id) || 0)}`
          }))
          .filter((card) => !card.text.endsWith(formatMoney(0)))
      };
    }

    const payer = state.people.find((person) => person.id === state.payerId);
    const cards = state.people
      .filter((person) => person.id !== state.payerId)
      .map((person) => ({
        kind: "owe",
        text: `${person.name} le paga ${formatMoney(contributions.get(person.id) || 0)} a ${payer?.name || "quien pago"}`
      }))
      .filter((card) => !card.text.includes(formatMoney(0)));

    return {
      mode: "single",
      cards: cards.length ? cards : [{ kind: "neutral", text: "No hay pagos pendientes." }]
    };
  }

  function calculateContributions() {
    const totals = new Map(state.people.map((person) => [person.id, 0]));
    state.products.forEach((product) => {
      if (!product.eatenBy.length) return;
      const base = Math.floor(product.priceCents / product.eatenBy.length);
      let remainder = product.priceCents - base * product.eatenBy.length;
      product.eatenBy.forEach((personId) => {
        const extra = remainder > 0 ? 1 : 0;
        remainder -= extra;
        totals.set(personId, (totals.get(personId) || 0) + base + extra);
      });
    });
    return totals;
  }

  function summaryLines() {
    const result = calculateResult();
    return ["claramente", ...result.cards.map((card) => card.text)].join("\n");
  }

  async function copySummary() {
    await copyText(summaryLines());
    showToast("Resumen copiado");
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(summaryLines())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function focusFirstField() {
    window.setTimeout(() => {
      els.root.querySelector("input")?.focus();
    }, 0);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2100);
  }

  function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function sanitizeText(value, maxLength) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function toCents(value) {
    const number = Number.parseFloat(String(value).replace(",", "."));
    if (!Number.isFinite(number)) return 0;
    return Math.round(number * 100);
  }

  function formatMoney(cents) {
    return moneyFormatter.format((cents || 0) / 100);
  }

  function personName(personId) {
    return state.people.find((person) => person.id === personId)?.name || "Persona";
  }

  function initialFor(name) {
    return (name || "?").trim().slice(0, 1).toUpperCase();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
