(function () {
  "use strict";

  const moneyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  });

  const screens = ["start", "people", "type", "items", "paid", "result"];
  const progress = {
    start: "Inicio",
    people: "1 de 4",
    type: "2 de 4",
    items: "2 de 4",
    paid: "3 de 4",
    result: "4 de 4",
    guest: "Tus respuestas"
  };

  // Domain is the only state that may be persisted or mapped.
  // screen, itemMode and editing are interface state and must stay out of storage.
  const domain = {
    people: [],
    items: [],
    paidMode: "",
    paymentMethod: "",
    cardPayerId: "",
    paidById: "",
    billId: "",
    claims: {},
    updatedAt: 0
  };

  const ui = {
    screen: "start",
    itemMode: "product",
    editing: null,
    guestList: null,
    guestPersonId: "",
    guestAte: [],
    guestChoice: {},
    guestIndex: 0,
    guestFixId: "",
    qrChunks: null,
    qrIndex: 0,
    qrInbox: [],
    qrProgress: null,
    askCode: false,
    showMore: false
  };

  const state = {
    get screen() { return ui.screen; },
    set screen(value) { ui.screen = value; },
    get itemMode() { return ui.itemMode; },
    set itemMode(value) { ui.itemMode = value; },
    get editing() { return ui.editing; },
    set editing(value) { ui.editing = value; },
    get people() { return domain.people; },
    set people(value) { domain.people = value; },
    get items() { return domain.items; },
    set items(value) { domain.items = value; },
    get paidMode() { return domain.paidMode; },
    set paidMode(value) { domain.paidMode = value; },
    get paymentMethod() { return domain.paymentMethod; },
    set paymentMethod(value) { domain.paymentMethod = value; },
    get cardPayerId() { return domain.cardPayerId; },
    set cardPayerId(value) { domain.cardPayerId = value; },
    get paidById() { return domain.paidById; },
    set paidById(value) { domain.paidById = value; },
    get updatedAt() { return domain.updatedAt; },
    set updatedAt(value) { domain.updatedAt = value; },
    get billId() { return domain.billId; },
    set billId(value) { domain.billId = value; },
    get claims() { return domain.claims; },
    set claims(value) { domain.claims = value; }
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
    toast: document.getElementById("toast"),
    scanDialog: document.getElementById("scanDialog"),
    scanVideo: document.getElementById("scanVideo"),
    qrPhoto: document.getElementById("qrPhoto"),
    closeScanBtn: document.getElementById("closeScanBtn")
  };

  let restoringHistory = false;
  let persistEnabled = false;
  let scanStream = null;
  let scanTimer = 0;
  let scanCanvas = null;
  let scanDetector = null;
  let savedGuided = null;
  let savedCanonical = null;
  let demoMode = false;
  let syncChoice = { action: "write", reason: "missing" };

  const TRIAL_CODE = "list1:AwMDAwMDAwMDAwMD.XtzIajRMfHhYLCovn3XTLo9VjIP98bZKDbPiwoK6MMrEwh9DudeHMKvnO2no7N0eXAZ6oKu4HwdzSUDCHACqBpaOXlqVhDV_KMTKq6-1rVffkOsFVQ87RJ9z-PUdYUxn5_gS69kKU2kBkAorA5d4yem3UzQEtq5ti6HF8Rkpc7_P1I6pUjXNBfF4Y4JBMLkeoQTzurDnmi0unxiYvGb_vTNQ9WIpTq9SPqTLxQLpuE8fyN3oQ-JP5o3n1KihJYkLFSa_jS9ZdErgcHst8M0VvT4zIbKtyQhNiEmbKkIZtsSCNaDTQbjZ5oiXTd0jC-c-sTLY1x3vlpOgY7n6G20wk6s8GXG4N0kH-C1N-XyL7pWxhxq1pWaN0Kp8XSzG_bD58Bk1:BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc";

  const iconPaths = {
    back: '<path d="M15 18l-6-6 6-6"/><path d="M9 12h12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21a6 6 0 0 0-12 0"/><circle cx="10" cy="8" r="4"/><path d="M22 21a5 5 0 0 0-5-5"/><path d="M16 3.2a4 4 0 0 1 0 7.6"/>',
    plate: '<circle cx="12" cy="12" r="7"/><path d="M5 3v6"/><path d="M3 3v6"/><path d="M7 3v6"/><path d="M19 3v18"/>',
    group: '<path d="M4 8h16"/><path d="M4 16h16"/><path d="M8 4v16"/><path d="M16 4v16"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    gift: '<path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 7v13"/><path d="M12 7H8.5A2.5 2.5 0 1 1 11 4.5L12 7Z"/><path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5L12 7Z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M12 7v10"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (window.ClaraStore) {
      savedGuided = window.ClaraStore.loadGuided(window.localStorage);
      savedCanonical = window.ClaraStore.loadCanonicalAsGuided(window.localStorage);
      syncChoice = window.ClaraStore.syncDecision(window.localStorage, savedGuided || { updatedAt: 0 });
    }
    const trial = new URLSearchParams(window.location.search).get("prueba") === "qr";
    if (trial && window.ClaraExchange) {
      demoMode = true;
      beginSession(demoBill());
      const incoming = window.location.hash.replace(/^#/, "");
      if (incoming.startsWith("part1:")) {
        try {
          await deliverMessage(await readExchange(incoming));
        } catch (error) {
          state.screen = "result";
          showToast("No pude abrir lo que marcaron");
        }
      } else {
        state.screen = "result";
        ui.qrChunks = [codeUrl(TRIAL_CODE)];
        ui.qrIndex = 0;
      }
    } else {
      await openIncoming();
      restoreResult();
    }
    const nextUrl = demoMode
      ? `${window.location.pathname}${window.location.search}`
      : state.screen === "guest"
        ? window.location.href
        : window.location.pathname + window.location.search;
    try {
      window.history.replaceState({ claramenteScreen: state.screen }, "", nextUrl);
    } catch (error) {
      /* un celular viejo puede rechazar el enlace largo; la pantalla sigue */
    }
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", () => { openIncoming(); });
    window.addEventListener("storage", refreshFromOtherScreen);
    if (state.screen === "result" && !demoMode) ensureShareCode();
    els.backBtn.addEventListener("click", goBack);
    els.closeSheetBtn.addEventListener("click", closeSheet);
    els.editForm.addEventListener("submit", saveEdit);
    els.root.addEventListener("click", handleRootClick);
    els.root.addEventListener("submit", handleRootSubmit);
    if (els.qrPhoto) els.qrPhoto.addEventListener("change", readQrPhoto);
    if (els.closeScanBtn) els.closeScanBtn.addEventListener("click", stopScan);
    render();
  }

  function render() {
    els.progressLabel.textContent = progress[state.screen];
    els.backBtn.hidden = state.screen === "start" || state.screen === "guest";
    els.backBtn.innerHTML = `${icon("back")}<span>Atras</span>`;

    const renderer = {
      start: renderStart,
      people: renderPeople,
      type: renderType,
      items: renderItems,
      paid: renderPaid,
      result: renderResult,
      guest: renderGuest
    }[state.screen];

    els.root.innerHTML = renderer();
    persistDomain();
    try {
      if (state.screen !== "guest") sessionStorage.setItem("clara.screen", state.screen);
    } catch (error) {
      /* seguir aunque el celular no guarde la pantalla */
    }
    if (state.screen === "guest") window.scrollTo(0, 0);
  }

  function renderHeader(title, help = "", kicker = "claramente") {
    return `
      <div class="screen-head">
        <p class="screen-kicker">${escapeHtml(kicker)}</p>
        <h1 class="screen-title">${escapeHtml(title)}</h1>
        ${help ? `<p class="screen-help">${escapeHtml(help)}</p>` : ""}
      </div>
    `;
  }

  function renderStart() {
    return `
      ${renderHeader("Vamos a dividir la cuenta", "Empieza agregando personas. Despues pones productos, quien comio y quien pago.")}
      <div class="panel">
        <p class="panel-note">Todo queda en este celular y puedes compartir el resumen al final.</p>
        <button class="primary-button" type="button" data-go="people"><span>Agregar personas</span></button>
        ${savedAccountButton()}
        <button class="quiet-link" type="button" data-prueba>Probar con una cuenta lista</button>
        <button class="quiet-link" type="button" data-ask-code>${ui.askCode ? "Ocultar" : "Ya me pasaron un enlace"}</button>
      </div>
      ${ui.askCode ? `<form class="panel form-grid" id="codeForm">
        <label class="field">
          <span>Pega aqui el enlace</span>
          <textarea id="codeInput" name="codeInput" rows="3" placeholder="Pega el enlace"></textarea>
        </label>
        <button class="primary-button" type="submit">Abrir</button>
      </form>` : ""}
    `;
  }

  function renderPeople() {
    const canContinue = state.people.length >= 2 && payers().length > 0;
    const message = state.people.length < 2
      ? "Agrega al menos a dos personas"
      : payers().length === 0
        ? "Al menos una persona debe pagar"
        : "Ir a productos";

    return `
      ${renderHeader("Quienes estan en la mesa?", "Escribe un nombre y toca agregar.")}
      <form class="panel form-grid" id="personForm" novalidate>
        <label class="field">
          <span>Nombre</span>
          <input id="personNameInput" name="personName" type="text" autocomplete="off" placeholder="Ana">
        </label>
        <p class="error-text" id="peopleError"></p>
        <button class="primary-button" type="submit">${icon("plus")}<span>Agregar persona</span></button>
      </form>
      <div class="list" aria-label="Personas agregadas">
        ${state.people.length ? state.people.map(renderPersonCard).join("") : `<div class="empty-state">Agrega a quienes estan en la mesa.</div>`}
      </div>
      <div class="sticky-actions">
        <button class="primary-button" type="button" data-go="items" ${canContinue ? "" : "disabled"}>${message}</button>
      </div>
    `;
  }

  function renderPersonCard(person) {
    const badge = person.isGuest ? "No va a pagar" : "Si va a pagar";
    return `
      <article class="person-card ${person.isGuest ? "is-guest" : ""}">
        <span class="initial" aria-hidden="true">${escapeHtml(initialFor(person.name))}</span>
        <div class="card-main">
          <h2 class="card-title">${escapeHtml(person.name)}</h2>
          <p class="card-meta">${escapeHtml(badge)}</p>
        </div>
        <div class="card-actions">
          <button class="mini-button" type="button" data-toggle-guest="${person.id}">${icon(person.isGuest ? "user" : "gift")}<span>${person.isGuest ? "Si paga" : "No paga"}</span></button>
          <button class="mini-button" type="button" data-edit-person="${person.id}">${icon("edit")}<span>Editar</span></button>
          <button class="mini-button mini-danger" type="button" data-remove-person="${person.id}">${icon("trash")}<span>Quitar</span></button>
        </div>
      </article>
    `;
  }

  function renderType() {
    return `
      ${renderHeader("Agregar productos y cargos", "Usa Producto para comida o bebidas. Usa Para todos para propina, taxi o cargos compartidos.")}
      <div class="list">
        ${renderTypeChoice("product", "Productos de la cuenta", "Tacos, pizza, refrescos", "plate")}
        ${renderTypeChoice("shared", "Gasto para todos", "Propina, taxi, botella", "group")}
      </div>
      ${state.items.length ? `
        <div class="panel compact-panel">
          <p class="panel-note">Ya llevas ${state.items.length} ${state.items.length === 1 ? "cosa" : "cosas"} en la cuenta.</p>
          <button class="secondary-button" type="button" data-go="items">Ver lo agregado</button>
        </div>
      ` : ""}
    `;
  }

  function renderTypeChoice(mode, title, help, iconName) {
    return `
      <button class="choice-card" type="button" data-item-mode="${mode}">
        <span class="choice-icon">${icon(iconName)}</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(help)}</span>
      </button>
    `;
  }

  function renderItems() {
    const pending = state.itemMode === "product"
      ? state.items.find((item) => item.type === "product" && (!item.eatenBy || item.eatenBy.length === 0))
      : null;
    const canContinue = itemsReady() && payers().length > 0;
    const finish = `
      <div class="sticky-actions">
        <button class="primary-button" type="button" data-go="paid" ${canContinue ? "" : "disabled"}>${canContinue ? "Ya termine la cuenta" : continueMessage()}</button>
      </div>
    `;
    if (pending) {
      return `
        ${renderHeader(`¿Quien comio ${pending.name}?`, "Toca los nombres. Si fueron todos, usa el boton de abajo.")}
        ${renderProductCard(pending)}
        ${finish}
      `;
    }
    return `
      ${renderHeader(itemQuestion(), itemHelp())}
      <div class="quick-row" aria-label="Tipo de cargo">
        <button class="quick-button ${state.itemMode === "shared" ? "active" : ""}" type="button" data-item-mode="shared">
          <strong>Lo comieron todos</strong>
          <span>Se reparte entre toda la mesa.</span>
        </button>
        <button class="quick-button ${state.itemMode === "product" ? "active" : ""}" type="button" data-item-mode="product">
          <strong>No todos lo comieron</strong>
          <span>Marca solo a quienes lo pidieron.</span>
        </button>
      </div>
      ${renderItemForm()}
      <section class="list" aria-label="Cuenta agregada">
        ${state.items.length ? displayItems().map(renderItemCard).join("") : `<div class="empty-state">Agrega lo primero de la cuenta.</div>`}
      </section>
      ${finish}
    `;
  }

  function itemQuestion() {
    if (state.itemMode === "shared") return "Agregar algo para todos";
    if (state.itemMode === "single") return "Agregar cargo de una persona";
    return "Agregar productos y cargos";
  }

  function itemHelp() {
    if (state.itemMode === "shared") return "Escribe el producto o cargo que se repartira entre todas las personas que pagan.";
    if (state.itemMode === "single") return "Usa esto para algo que solo consumio una persona. Aqui tambien marcas quien lo pago.";
    return "Escribe el producto y despues marca exactamente quienes lo comieron.";
  }

  function renderItemForm() {
    if (state.itemMode === "shared") {
      return `
        <form class="panel form-grid" id="sharedForm" novalidate>
          <label class="field">
            <span>Producto o cargo</span>
            <input id="sharedNameInput" name="itemName" type="text" autocomplete="off" placeholder="Pizza">
          </label>
          <label class="field">
            <span>Monto</span>
            <input name="itemAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
          </label>
          <p class="error-text" id="itemError"></p>
          <button class="primary-button" type="submit">${icon("plus")}<span>Agregar para todos</span></button>
        </form>
      `;
    }

    if (state.itemMode === "single") {
      return `
        <form class="panel form-grid" id="singleForm" novalidate>
          <label class="field">
            <span>Nombre del gasto</span>
            <input id="singleNameInput" name="itemName" type="text" autocomplete="off" placeholder="Cafe">
          </label>
          <label class="field">
            <span>Monto</span>
            <input name="itemAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
          </label>
          <label class="field">
            <span>De quien es</span>
            <select name="ownerId">${personOptions()}</select>
          </label>
          <label class="field">
            <span>Quien lo pago</span>
            <select name="paidById">${personOptions()}</select>
          </label>
          <p class="error-text" id="itemError"></p>
          <button class="primary-button" type="submit">${icon("plus")}<span>Agregar gasto de una persona</span></button>
        </form>
      `;
    }

    return `
      <form class="panel form-grid" id="productForm" novalidate>
        <label class="field">
          <span>Producto</span>
          <input id="productNameInput" name="itemName" type="text" autocomplete="off" placeholder="Pizza">
        </label>
        <label class="field">
          <span>Precio</span>
          <input name="itemAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
        </label>
        <p class="error-text" id="itemError"></p>
        <button class="primary-button" type="submit">${icon("plus")}<span>Agregar producto</span></button>
      </form>
    `;
  }

  function renderItemCard(item) {
    if (item.type === "shared") return renderSharedCard(item);
    if (item.type === "single") return renderSingleCard(item);
    return renderProductCard(item);
  }

  function displayItems() {
    return state.items.slice().reverse();
  }

  function renderProductCard(item) {
    const names = namesFor(item.eatenBy);
    const missing = item.eatenBy.length === 0;
    return `
      <article class="product-card">
        <div class="card-row">
          <span class="card-icon">${icon("plate")}</span>
          <div>
            <h2 class="card-title">${escapeHtml(item.name)}</h2>
            <p class="money">${formatMoney(item.amountCents)}</p>
          </div>
        </div>
        <p class="card-meta">${missing ? "Elige quien comio esto" : `Lo comieron: ${escapeHtml(names)}`}</p>
        ${missing ? `<div class="product-warning">Elige quien comio esto para seguir.</div>` : ""}
        <div class="person-picker" aria-label="Quien comio ${escapeAttr(item.name)}">
          ${state.people.map((person) => renderPickButton(person, item.eatenBy, `data-toggle-eater="${item.id}:${person.id}"`)).join("")}
          <button class="pick-button" type="button" data-item-all="${item.id}">Todos comieron esto</button>
        </div>
        ${renderItemActions(item)}
      </article>
    `;
  }

  function renderSharedCard(item) {
    return `
      <article class="product-card shared-card">
        <div class="card-row">
          <span class="card-icon">${icon("group")}</span>
          <div>
            <h2 class="card-title">${escapeHtml(item.name)}</h2>
            <p class="money">${formatMoney(item.amountCents)}</p>
          </div>
        </div>
        <p class="tag-line">Se divide entre: ${escapeHtml(namesFor(item.splitWith))}</p>
        ${renderItemActions(item)}
      </article>
    `;
  }

  function renderSingleCard(item) {
    return `
      <article class="product-card single-card">
        <div class="card-row">
          <span class="card-icon">${icon("person")}</span>
          <div>
            <h2 class="card-title">${escapeHtml(item.name)}</h2>
            <p class="money">${formatMoney(item.amountCents)}</p>
          </div>
        </div>
        <p class="tag-line">De: ${escapeHtml(personName(item.ownerId))}</p>
        <p class="tag-line">Pago: ${escapeHtml(personName(item.paidById))}</p>
        ${renderItemActions(item)}
      </article>
    `;
  }

  function renderItemActions(item) {
    return `
      <div class="card-actions">
        <button class="mini-button" type="button" data-edit-item="${item.id}">${icon("edit")}<span>Editar</span></button>
        <button class="mini-button" type="button" data-duplicate-item="${item.id}">${icon("copy")}<span>Otro igual</span></button>
        <button class="mini-button mini-danger" type="button" data-remove-item="${item.id}">${icon("trash")}<span>Quitar</span></button>
      </div>
    `;
  }

  function renderPickButton(person, selectedIds, dataAttr) {
    const active = selectedIds.includes(person.id);
    return `
      <button class="pick-button ${active ? "active" : ""} ${person.isGuest ? "guest-pick" : ""}" type="button" ${dataAttr}>
        ${active ? icon("check") : ""}
        <span>${escapeHtml(person.name)}</span>
      </button>
    `;
  }

  function renderPaid() {
    const canContinue = paidReady();
    const action = state.paidMode
      ? `<div class="sticky-actions">
          <button class="primary-button" type="button" data-go="result" ${canContinue ? "" : "disabled"}>${canContinue ? "Calcular cuenta" : paidMessage()}</button>
        </div>`
      : "";
    if (!state.paidMode) {
      return `
        ${renderHeader("¿La cuenta ya se pago?", "Elige una. Despues solo te pedimos lo que falta.")}
        <div class="list paid-mode-list" aria-label="Situacion de pago">
          ${renderPaidMode("single", "Alguien ya pago", "Calculamos cuanto deben devolverle.", "user")}
          ${renderPaidMode("none", "Todavia no se ha pagado", "Van a juntar el dinero antes de pagar.", "coin")}
          ${renderPaidMode("multiple", "Cada producto lo pago alguien distinto", "Usalo solo si varias personas ya pagaron productos separados.", "users")}
        </div>
      `;
    }
    const title = state.paidMode === "none" ? "¿Como van a pagar?" : state.paidMode === "multiple" ? "¿Quien pago cada cosa?" : "¿Quien pago?";
    return `
      ${renderHeader(title, "Una sola respuesta. Luego calculamos.")}
      ${state.paidMode === "none" ? renderUnpaidMethod() : ""}
      ${state.paidMode === "single" ? renderPaidPeople() + renderPaidMethod("¿Con que pago?", "Toca efectivo o tarjeta.") : ""}
      ${state.paidMode === "multiple" ? renderMultiplePaid() : ""}
      <div class="panel">
        <button class="secondary-button" type="button" data-go="items">Editar cuenta antes de calcular</button>
        <button class="secondary-button" type="button" data-clear-paid>Elegir otra situacion</button>
      </div>
      ${action}
    `;
  }

  function renderPaidMode(mode, title, help, iconName) {
    return `
      <button class="choice-card ${state.paidMode === mode ? "active" : ""}" type="button" data-paid-mode="${mode}">
        <span class="choice-icon">${icon(iconName)}</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(help)}</span>
      </button>
    `;
  }

  function renderPaidPeople() {
    return `
      <section class="list payer-list" aria-label="Quien pago toda la cuenta">
        <div class="section-note">¿Quien pago la cuenta?</div>
        ${state.people.map((person) => `
          <button class="payer-card ${state.paidById === person.id ? "active" : ""}" type="button" data-paid-by="${person.id}">
            <span class="choice-icon">${icon(person.isGuest ? "gift" : "user")}</span>
            <strong>${escapeHtml(person.name)}</strong>
            <span>${person.isGuest ? "Pago, aunque no aporta" : "Pago la cuenta"}</span>
          </button>
        `).join("")}
      </section>
    `;
  }

  function renderUnpaidMethod() {
    return `
      ${renderPaidMethod("¿Como van a pagar?", "Si van a usar una tarjeta, dinos quien la pondra.")}
      ${state.paymentMethod === "card" ? renderCardPayer() : ""}
    `;
  }

  function renderPaidMethod(title, help) {
    return `
      <section class="payment-section" aria-label="${escapeAttr(title)}">
        <h2 class="payment-section-title">${escapeHtml(title)}</h2>
        <p class="section-note">${escapeHtml(help)}</p>
        <div class="quick-row payment-method-row">
          <button class="quick-button ${state.paymentMethod === "cash" ? "active" : ""}" type="button" data-payment-method="cash">Efectivo</button>
          <button class="quick-button ${state.paymentMethod === "card" ? "active" : ""}" type="button" data-payment-method="card">Tarjeta</button>
        </div>
      </section>
    `;
  }

  function renderCardPayer() {
    return `
      <section class="list payer-list" aria-label="Quien pondra la tarjeta">
        <div class="section-note">¿Quien pondra la tarjeta?</div>
        <p class="section-note">Esa persona recibe el dinero de los demas antes o despues de pagar.</p>
        ${state.people.map((person) => `
          <button class="payer-card ${state.cardPayerId === person.id ? "active" : ""}" type="button" data-card-payer="${person.id}">
            <span class="choice-icon">${icon(person.isGuest ? "gift" : "user")}</span>
            <strong>${escapeHtml(person.name)}</strong>
            <span>${person.isGuest ? "Usa tarjeta, aunque no aporta" : "Pondra la tarjeta"}</span>
          </button>
        `).join("")}
      </section>
    `;
  }

  function renderMultiplePaid() {
    return `
      <section class="list paid-list" aria-label="Quien pago cada cosa">
        <div class="section-note">Marca quien pago cada producto. Si una persona pago todo, usa la opcion anterior.</div>
        ${displayItems().map((item) => `
          <article class="product-card paid-item">
            <h2 class="card-title">${escapeHtml(item.name)}</h2>
            <p class="card-meta">${itemLabel(item)} - ${formatMoney(item.amountCents)}</p>
            <div class="person-picker">
              ${state.people.map((person) => renderPickButton(person, [item.paidById].filter(Boolean), `data-item-paid="${item.id}:${person.id}"`)).join("")}
            </div>
          </article>
        `).join("")}
      </section>
    `;
  }

  function renderResult() {
    const result = calculateResult();
    return `
      ${renderHeader("Muestra este dibujo", "Pide que lo escaneen con la camara del celular.")}
      ${ui.qrChunks && ui.qrChunks.length ? renderQrPanel() : `<p class="section-note">Preparando el dibujo...</p>`}
      ${renderRectification()}
      ${renderWhoAte()}
      ${renderSplitNote()}
      <section class="list">
        ${result.cards.map(renderResultCard).join("")}
      </section>
      <div class="panel">
        <button class="primary-button" type="button" data-scan-live>Leer el dibujo de alguien</button>
      </div>
      <div class="panel">
        <button class="secondary-button" type="button" data-show-more>${ui.showMore ? "Ocultar opciones" : "Otras opciones"}</button>
        ${ui.showMore ? `
          <button class="secondary-button" type="button" data-share-whatsapp>${icon("send")}<span>Enviar por WhatsApp</span></button>
          <button class="secondary-button" type="button" data-copy-summary>${icon("copy")}<span>Copiar resumen</span></button>
          <button class="secondary-button" type="button" data-share-list>${icon("send")}<span>Compartir lista</span></button>
          <form class="form-grid" id="partForm">
            <label class="field">
              <span>Si no puede escanear, pega el enlace</span>
              <textarea id="partCode" name="partCode" rows="3" placeholder="Pega el enlace"></textarea>
            </label>
            <button class="secondary-button" type="submit">Abrir enlace</button>
          </form>
          <button class="secondary-button" type="button" data-go="people">Editar personas</button>
          <button class="secondary-button" type="button" data-go="items">Editar cuenta</button>
          <button class="secondary-button" type="button" data-go="paid">Editar quien pago</button>
        ` : ""}
      </div>
    `;
  }

  function renderWhoAte() {
    const lines = state.items.filter((item) => item.type === "product").map((item) => {
      const names = (item.eatenBy || []).map(personName).filter(Boolean);
      const text = names.length ? `${item.name}: ${names.join(", ")}` : `${item.name}: todavia entre todos`;
      return `<article class="result-card neutral"><strong>${escapeHtml(text)}</strong></article>`;
    });
    if (!lines.length) return "";
    return `<section class="list">${lines.join("")}</section>`;
  }

  function renderSplitNote() {
    const open = state.items.some((item) => item.type === "product" && (!item.eatenBy || item.eatenBy.length === 0));
    if (!open) return "";
    return `<p class="section-note">Lo que nadie marco se reparte entre todos. Por eso un monto puede subir.</p>`;
  }

  function renderResultCard(card) {
    return `
      <article class="result-card ${card.kind}">
        <span class="result-icon">${icon(card.kind === "receive" ? "coin" : card.kind === "neutral" ? "gift" : "send")}</span>
        <strong>${escapeHtml(card.text)}</strong>
      </article>
    `;
  }

  function renderRectification() {
    if (!window.ClaraExchange || !state.billId) return "";
    const lines = window.ClaraExchange.rectify(domainSnapshot()).map((issue) => {
      if (issue.type === "missing") return `Falta que ${personName(issue.personId)} marque lo suyo`;
      if (issue.type === "two-owners") return `Dos personas marcaron ${itemName(issue.itemId)}. Preguntales.`;
      return "";
    }).filter(Boolean);
    if (!lines.length) return "";
    return `<section class="list">${lines.map((line) => `<article class="result-card neutral"><strong>${escapeHtml(line)}</strong></article>`).join("")}</section>`;
  }

  function renderGuest() {
    const list = ui.guestList;
    if (!list) return "";
    if (!ui.guestPersonId) {
      return `
        ${renderHeader("Como te llamas?", "Toca tu nombre. Solo una vez.")}
        <div class="name-list">
          ${list.people.map((person) => `<button class="pick-button" type="button" data-guest-person="${escapeAttr(person.id)}"><span>${escapeHtml(person.name)}</span></button>`).join("")}
        </div>
      `;
    }
    const products = guestProducts();
    const item = products[ui.guestIndex];
    if (item && !ui.qrChunks) {
      return `
        ${renderHeader(`¿${item.name} es tuyo?`, `${formatMoney(item.amountCents)}. Pregunta ${ui.guestIndex + 1} de ${products.length}.`)}
        <div class="yes-no">
          <button class="primary-button" type="button" data-guest-answer="1">Si</button>
          <button class="secondary-button" type="button" data-guest-answer="0">No</button>
        </div>
        <div class="panel">
          <button class="secondary-button" type="button" data-guest-back>Atras</button>
        </div>
      `;
    }
    const person = list.people.find((entry) => entry.id === ui.guestPersonId);
    return `
      ${renderHeader("Ensenale esto a quien pago", person ? `Listo, ${person.name}. No cierres esta pantalla.` : "No cierres esta pantalla.")}
      ${renderQrPanel()}
      <div class="panel">
        ${guestProducts().map((item) => `<button class="secondary-button" type="button" data-guest-fix="${escapeAttr(item.id)}"><span>Cambiar ${escapeHtml(item.name)}</span></button>`).join("")}
      </div>
    `;
  }

  function guestProducts() {
    const list = ui.guestList;
    if (!list) return [];
    return list.items.filter((item) => item.type !== "shared");
  }

  function pendingGuestItem() {
    return guestProducts().find((item) => ui.guestChoice[item.id] !== true && ui.guestChoice[item.id] !== false);
  }

  async function answerGuest(mine) {
    const products = guestProducts();
    const item = products[ui.guestIndex];
    if (!item) return showGuestCode();
    ui.guestChoice[item.id] = mine;
    ui.guestAte = products.filter((product) => ui.guestChoice[product.id] === true).map((product) => product.id);
    saveGuestSession();
    if (ui.guestFixId) {
      ui.guestFixId = "";
      return showGuestCode();
    }
    let next = -1;
    for (let index = ui.guestIndex + 1; index < products.length; index += 1) {
      if (ui.guestChoice[products[index].id] !== true && ui.guestChoice[products[index].id] !== false) {
        next = index;
        break;
      }
    }
    if (next === -1) return showGuestCode();
    ui.guestIndex = next;
    ui.qrChunks = null;
    render();
  }

  function guestBack() {
    if (ui.qrChunks) {
      ui.qrChunks = null;
      ui.guestIndex = Math.max(guestProducts().length - 1, 0);
      render();
      return;
    }
    if (ui.guestIndex > 0) {
      ui.guestIndex -= 1;
      render();
      return;
    }
    ui.guestPersonId = "";
    render();
  }

  function scrollToNode(id) {
    window.requestAnimationFrame(() => {
      const node = document.getElementById(id);
      if (!node) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }

  function saveGuestSession() {
    if (!ui.guestList) return;
    try {
      sessionStorage.setItem("clara.guest", JSON.stringify({
        billId: ui.guestList.billId,
        personId: ui.guestPersonId,
        choice: ui.guestChoice,
        index: ui.guestIndex
      }));
    } catch (error) {
      /* la pregunta se puede repetir si el celular no guarda */
    }
  }

  function savedGuest(billId) {
    try {
      const raw = JSON.parse(sessionStorage.getItem("clara.guest") || "null");
      if (!raw || raw.billId !== billId) return null;
      return raw;
    } catch (error) {
      return null;
    }
  }

  function restoreResult() {
    if (state.screen !== "start" || demoMode || !savedGuided || !savedGuided.items || !savedGuided.items.length) return;
    let remembered = "";
    try { remembered = sessionStorage.getItem("clara.screen") || ""; } catch (error) { remembered = ""; }
    if (remembered !== "result") return;
    beginSession(savedGuided);
    state.screen = "result";
  }

  function refreshFromOtherScreen(event) {
    if (!event || event.key !== "claramente.flow.v1" || !event.newValue || state.screen === "guest" || demoMode) return;
    try {
      const saved = JSON.parse(event.newValue);
      if (!saved || !saved.billId || saved.billId !== state.billId) return;
      applyDomain(saved);
      state.screen = "result";
      ui.qrChunks = null;
      render();
      ensureShareCode();
    } catch (error) {
      /* la otra pantalla traia datos incompletos */
    }
  }

  async function openIncoming() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw || !window.ClaraExchange) return;
    if (!raw.startsWith("list1:") && !raw.startsWith("part1:") && !raw.startsWith("qr1:")) return;
    try {
      const message = await readExchange(raw);
      if (!message) return;
      await deliverMessage(message);
    } catch (error) {
      showToast("No pude abrir este dibujo");
    }
  }

  async function prepareListCode() {
    if (!window.ClaraExchange) return "";
    if (!state.people.length || !state.items.length) return "";
    if (!state.billId) state.billId = createId("mesa");
    const code = await window.ClaraExchange.seal("list1", window.ClaraExchange.toList(domainSnapshot()));
    ui.qrChunks = window.ClaraExchange.splitQr(code);
    ui.qrIndex = 0;
    return code;
  }

  async function ensureShareCode() {
    if (ui.qrChunks && ui.qrChunks.length && String(ui.qrChunks[0]).startsWith("http")) return;
    const code = await prepareListCode();
    if (!code || state.screen !== "result") return;
    ui.qrChunks = [codeUrl(code)];
    ui.qrIndex = 0;
    render();
  }

  async function shareList() {
    const code = await prepareListCode();
    if (!code) return showToast("Primero arma la cuenta");
    ui.qrChunks = [codeUrl(code)];
    ui.qrIndex = 0;
    render();
  }

  async function showGuestCode() {
    if (!window.ClaraExchange || !ui.guestList || !ui.guestPersonId) return showToast("Toca tu nombre");
    const code = await window.ClaraExchange.seal("part1", {
      kind: "part",
      billId: ui.guestList.billId,
      personId: ui.guestPersonId,
      ate: ui.guestAte.slice()
    });
    ui.qrChunks = [partUrl(code)];
    ui.qrIndex = 0;
    render();
  }

  async function readPastedCode(form) {
    try {
      await deliverMessage(await readExchange(form.elements.codeInput.value.trim()));
    } catch (error) {
      showToast("No pude abrir este dibujo");
    }
  }

  async function readPastedPart(form) {
    const raw = form.elements.partCode.value.trim();
    const code = raw.includes("#") ? raw.slice(raw.lastIndexOf("#") + 1) : raw;
    try {
      await deliverMessage(await readExchange(code));
    } catch (error) {
      showToast("No pude leer ese enlace");
    }
  }

  function renderQrPanel() {
    if (!ui.qrChunks || !ui.qrChunks.length || !window.ClaraQr) return "";
    const current = ui.qrChunks[ui.qrIndex] || "";
    const link = current.startsWith("http");
    const note = !link
      ? "Dibujo para la otra pantalla"
      : state.screen === "guest"
        ? "Ensenale esta pantalla a quien pago."
        : "Un dibujo. La otra persona lo escanea y abre la cuenta.";
    return `
      <section class="panel" id="guestQr">
        <p class="section-note">${note}</p>
        ${state.screen === "guest" ? guestProducts().map((item) => `<p class="card-meta">${escapeHtml(item.name)}: ${ui.guestChoice[item.id] === true ? "es tuyo" : "no es tuyo"}</p>`).join("") : ""}
        ${window.ClaraQr.toSvg(current)}
      </section>
    `;
  }

  function partUrl(code) {
    const trial = ui.guestList && ui.guestList.billId === "mesa_prueba";
    return `${window.location.origin}${window.location.pathname}${trial ? "?prueba=qr" : ""}#${code}`;
  }

  function stepQr(delta) {
    if (!ui.qrChunks || !ui.qrChunks.length) return;
    ui.qrIndex = (ui.qrIndex + delta + ui.qrChunks.length) % ui.qrChunks.length;
    render();
  }

  async function shareOrCopy(text) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Claramente", text });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    await copyText(text);
    showToast("Enlace copiado");
  }

  async function shareQrChunk() {
    const chunk = ui.qrChunks && ui.qrChunks[ui.qrIndex];
    if (!chunk) return;
    await shareOrCopy(ui.qrChunks.length === 1 && !chunk.startsWith("qr1:") ? codeUrl(chunk) : chunk);
  }

  async function deliverMessage(message) {
    if (!message) return;
    if (message.kind === "list") {
      ui.screen = "guest";
      ui.guestList = message;
      ui.guestPersonId = "";
      ui.guestAte = [];
      ui.guestChoice = {};
      ui.guestIndex = 0;
      ui.guestFixId = "";
      ui.qrChunks = null;
      const saved = savedGuest(message.billId);
      if (saved && message.people.some((person) => person.id === saved.personId)) {
        ui.guestPersonId = saved.personId;
        ui.guestChoice = saved.choice && typeof saved.choice === "object" ? saved.choice : {};
        ui.guestIndex = Number.isInteger(saved.index) ? saved.index : 0;
        ui.guestAte = guestProducts().filter((item) => ui.guestChoice[item.id] === true).map((item) => item.id);
      }
      render();
      if (ui.guestPersonId && !pendingGuestItem()) return showGuestCode();
      return;
    }
    const base = persistEnabled ? domainSnapshot() : savedGuided;
    if (!base || base.billId !== message.billId) {
      showToast("Esto no es de la cuenta de este celular");
      return;
    }
    const applied = window.ClaraExchange.applyPart(base, message);
    if (!applied.ok) {
      showToast("No pude sumar lo que marcaron");
      return;
    }
    if (persistEnabled) applyDomain(applied.state);
    else beginSession(applied.state);
    state.screen = "result";
    persistDomain.last = null;
    render();
    showToast(`Listo. ${personName(message.personId)} ya marco lo suyo.`);
  }

  async function readQrPhoto() {
    const file = els.qrPhoto && els.qrPhoto.files && els.qrPhoto.files[0];
    if (els.qrPhoto) els.qrPhoto.value = "";
    if (!file || !window.ClaraQr) return;
    try {
      const text = await window.ClaraQr.readFile(file);
      if (!text) return showToast("No vi un dibujo en esa foto");
      await deliverMessage(await readExchange(text));
    } catch (error) {
      showToast("No pude leer esa foto");
    }
  }

  async function startScan() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !els.scanDialog || !els.scanVideo) {
      showToast("Elige la foto del dibujo.");
      if (els.qrPhoto) els.qrPhoto.click();
      return;
    }
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    } catch (error) {
      showToast("No pude abrir la camara. Elige la foto del dibujo.");
      if (els.qrPhoto) els.qrPhoto.click();
      return;
    }
    els.scanVideo.srcObject = scanStream;
    await els.scanVideo.play();
    els.scanDialog.showModal();
    scanFrame();
  }

  async function scanFrame() {
    if (!scanStream || !els.scanVideo || els.scanVideo.readyState < 2) {
      if (scanStream) scanTimer = requestAnimationFrame(scanFrame);
      return;
    }
    const canvas = scanCanvas || document.createElement("canvas");
    scanCanvas = canvas;
    canvas.width = els.scanVideo.videoWidth;
    canvas.height = els.scanVideo.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(els.scanVideo, 0, 0);
    let text = "";
    if (typeof BarcodeDetector === "function") {
      try {
        const detector = scanDetector || new BarcodeDetector({ formats: ["qr_code"] });
        scanDetector = detector;
        const codes = await detector.detect(canvas);
        text = codes[0] && codes[0].rawValue || "";
      } catch (error) {
        scanDetector = null;
      }
    }
    if (!text && window.ClaraQr) {
      text = window.ClaraQr.readPixels(context.getImageData(0, 0, canvas.width, canvas.height));
    }
    if (text) {
      stopScan();
      try {
        await deliverMessage(await readExchange(text));
      } catch (error) {
        showToast("No pude abrir este dibujo");
      }
      return;
    }
    scanTimer = requestAnimationFrame(scanFrame);
  }

  function stopScan() {
    if (scanTimer) cancelAnimationFrame(scanTimer);
    scanTimer = 0;
    if (scanStream) scanStream.getTracks().forEach((track) => track.stop());
    scanStream = null;
    if (els.scanVideo) els.scanVideo.srcObject = null;
    if (els.scanDialog && els.scanDialog.open) els.scanDialog.close();
  }

  async function copyQrChunk() {
    const chunk = ui.qrChunks && ui.qrChunks[ui.qrIndex];
    if (!chunk) return;
    await copyText(chunk);
    showToast("Enlace copiado");
  }

  async function readExchange(raw) {
    let text = String(raw || "").trim();
    const hashAt = text.indexOf("#");
    if (/^https?:\/\//i.test(text) && hashAt !== -1) text = text.slice(hashAt + 1);
    try {
      text = decodeURIComponent(text);
    } catch (error) {
      text = String(raw || "").trim();
    }
    if (!text.includes("qr1:")) return window.ClaraExchange.openCode(text);
    const incoming = text.split(/\s+/).filter((line) => line.startsWith("qr1:"));
    ui.qrInbox = ui.qrInbox.concat(incoming);
    try {
      return await finishQr(ui.qrInbox);
    } catch (error) {
      if (error.message !== "QR_MIXED" && error.message !== "QR_CONFLICT" && error.message !== "QR_INVALID") throw error;
      ui.qrInbox = incoming.slice();
      return finishQr(ui.qrInbox);
    }
  }

  async function finishQr(lines) {
    try {
      const code = window.ClaraExchange.joinQr(lines);
      ui.qrInbox = [];
      ui.qrProgress = null;
      return window.ClaraExchange.openCode(code);
    } catch (error) {
      if (error.message === "QR_INCOMPLETE") {
        ui.qrProgress = { have: error.have, total: error.total };
        showToast(`Falta un dibujo. Van ${error.have} de ${error.total}`);
        render();
        return null;
      }
      throw error;
    }
  }

  function codeUrl(code) {
    return `${window.location.origin}${window.location.pathname}#${code}`;
  }

  function itemName(itemId) {
    return findItem(itemId)?.name || "Producto";
  }

  function handleRootSubmit(event) {
    event.preventDefault();
    if (event.target.id === "personForm") addPerson(event.target);
    if (event.target.id === "productForm") addProduct(event.target);
    if (event.target.id === "sharedForm") addShared(event.target);
    if (event.target.id === "singleForm") addSingle(event.target);
    if (event.target.id === "partForm") return readPastedPart(event.target);
    if (event.target.id === "codeForm") return readPastedCode(event.target);
  }

  function handleRootClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.go) return goTo(button.dataset.go);
    if (button.hasAttribute("data-open-saved")) return openSavedAccount();
    if (button.hasAttribute("data-bring-canonical")) return bringCanonicalAccount();
    if (button.dataset.toast) return showToast(button.dataset.toast);
    if (button.dataset.itemMode) return chooseItemMode(button.dataset.itemMode);
    if (button.dataset.editPerson) return openPersonEdit(button.dataset.editPerson);
    if (button.dataset.removePerson) return removePerson(button.dataset.removePerson);
    if (button.dataset.toggleGuest) return toggleGuest(button.dataset.toggleGuest);
    if (button.dataset.editItem) return openItemEdit(button.dataset.editItem);
    if (button.dataset.removeItem) return removeItem(button.dataset.removeItem);
    if (button.dataset.duplicateItem) return duplicateItem(button.dataset.duplicateItem);
    if (button.dataset.itemAll) return selectAllEaters(button.dataset.itemAll);
    if (button.dataset.toggleEater) {
      const [itemId, personId] = button.dataset.toggleEater.split(":");
      return toggleEater(itemId, personId);
    }
    if (button.dataset.paidMode) return setPaidMode(button.dataset.paidMode);
    if (button.dataset.paymentMethod) return setPaymentMethod(button.dataset.paymentMethod);
    if (button.dataset.cardPayer) return setCardPayer(button.dataset.cardPayer);
    if (button.dataset.paidBy) return setPaidBy(button.dataset.paidBy);
    if (button.dataset.itemPaid) {
      const [itemId, personId] = button.dataset.itemPaid.split(":");
      return setItemPaidBy(itemId, personId);
    }
    if (button.hasAttribute("data-share-whatsapp")) return shareWhatsApp();
    if (button.hasAttribute("data-copy-summary")) return copySummary();
    if (button.hasAttribute("data-share-list")) return shareList();
    if (button.hasAttribute("data-prueba")) {
      window.location.assign(`${window.location.pathname}?prueba=qr#${TRIAL_CODE}`);
      return;
    }
    if (button.hasAttribute("data-ask-code")) {
      ui.askCode = !ui.askCode;
      return render();
    }
    if (button.hasAttribute("data-show-more")) {
      ui.showMore = !ui.showMore;
      return render();
    }
    if (button.hasAttribute("data-clear-paid")) {
      state.paidMode = "";
      return render();
    }
    if (button.dataset.guestPerson) {
      ui.guestPersonId = button.dataset.guestPerson;
      ui.guestIndex = 0;
      ui.qrChunks = null;
      saveGuestSession();
      if (!guestProducts().length) return showGuestCode();
      return render();
    }
    if (button.dataset.guestAnswer) return answerGuest(button.dataset.guestAnswer === "1");
    if (button.hasAttribute("data-guest-back")) return guestBack();
    if (button.dataset.guestFix) {
      const index = guestProducts().findIndex((item) => item.id === button.dataset.guestFix);
      if (index < 0) return;
      ui.guestFixId = button.dataset.guestFix;
      ui.guestIndex = index;
      ui.qrChunks = null;
      return render();
    }
    if (button.hasAttribute("data-copy-part") || button.hasAttribute("data-share-part")) return showGuestCode();
    if (button.hasAttribute("data-qr-prev")) return stepQr(-1);
    if (button.hasAttribute("data-qr-next")) return stepQr(1);
    if (button.hasAttribute("data-qr-copy")) return copyQrChunk();
    if (button.hasAttribute("data-share-code")) return shareQrChunk();
    if (button.hasAttribute("data-scan-photo")) {
      if (els.qrPhoto) els.qrPhoto.click();
      return;
    }
    if (button.hasAttribute("data-scan-live")) return startScan();
  }

  function addPerson(form) {
    const input = form.elements.personName;
    const name = sanitizeText(input.value, 40);
    const error = document.getElementById("peopleError");
    if (!name) return showFieldError(error, input, "Falta el nombre");
    if (state.people.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
      return showFieldError(error, input, "Ese nombre ya esta en la mesa");
    }
    state.people.push({ id: createId("p"), name, isGuest: false });
    syncSharedSplits();
    input.value = "";
    render();
  }

  function addProduct(form) {
    const values = readItemForm(form);
    if (!values) return;
    state.items.push({
      id: createId("prod"),
      type: "product",
      name: values.name,
      amountCents: values.amountCents,
      eatenBy: []
    });
    clearItemForm(form);
    render();
  }

  function addShared(form) {
    const values = readItemForm(form);
    if (!values) return;
    const splitWith = payers().map((person) => person.id);
    state.items.push({
      id: createId("shared"),
      type: "shared",
      name: values.name,
      amountCents: values.amountCents,
      splitWith
    });
    clearItemForm(form);
    render();
  }

  function addSingle(form) {
    const values = readItemForm(form);
    if (!values) return;
    state.items.push({
      id: createId("single"),
      type: "single",
      name: values.name,
      amountCents: values.amountCents,
      ownerId: form.elements.ownerId.value,
      paidById: form.elements.paidById.value
    });
    clearItemForm(form);
    render();
  }

  function readItemForm(form) {
    const nameInput = form.elements.itemName;
    const amountInput = form.elements.itemAmount;
    const error = document.getElementById("itemError");
    const name = sanitizeText(nameInput.value, 60);
    const amountCents = toCents(amountInput.value);
    if (!name) {
      showFieldError(error, nameInput, form.id === "productForm" ? "Falta el producto" : "Falta el nombre");
      return null;
    }
    if (amountCents <= 0) {
      showFieldError(error, amountInput, "Ponle un precio");
      return null;
    }
    return { name, amountCents };
  }

  function clearItemForm(form) {
    form.elements.itemName.value = "";
    form.elements.itemAmount.value = "";
  }

  function chooseItemMode(mode) {
    state.itemMode = mode;
    state.screen = mode ? "items" : state.screen;
    render();
  }

  function goTo(screen) {
    if (!screens.includes(screen)) return;
    if (screen === "type" && state.people.length < 2) {
      showToast("Agrega al menos a dos personas para dividir.");
      return;
    }
    if (screen === "type" && payers().length === 0) {
      showToast("Al menos una persona debe pagar.");
      return;
    }
    if (screen === "paid" && !itemsReady()) {
      showToast(continueMessage());
      return;
    }
    if (screen === "result" && !paidReady()) {
      showToast(paidMessage());
      return;
    }
    if (state.screen === screen) return;
    if (state.screen === "start") beginSession();
    state.screen = screen;
    pushFlowHistory(screen);
    render();
    if (screen === "result") ensureShareCode();
  }

  function goBack() {
    const index = screens.indexOf(state.screen);
    if (index <= 0) return;
    if (window.history.state?.claramenteScreen === state.screen) {
      window.history.back();
      return;
    }
    state.screen = screens[index - 1];
    render();
  }

  function pushFlowHistory(screen) {
    if (restoringHistory) return;
    window.history.pushState({ claramenteScreen: screen }, "", window.location.href);
  }

  function handlePopState(event) {
    const screen = event.state?.claramenteScreen;
    if (!screens.includes(screen)) return;
    restoringHistory = true;
    state.screen = screen;
    render();
    restoringHistory = false;
  }

  function itemsReady() {
    if (!state.items.length) return false;
    return state.items.every((item) => {
      if (item.type === "product") return item.eatenBy.length > 0;
      if (item.type === "shared") return item.splitWith.length > 0;
      if (item.type === "single") return item.ownerId && item.paidById;
      return false;
    });
  }

  function continueMessage() {
    if (!state.items.length) return "Agrega algo a la cuenta";
    if (payers().length === 0) return "Al menos una persona debe pagar";
    if (state.items.some((item) => item.type === "product" && item.eatenBy.length === 0)) return "Falta elegir quien comio";
    if (state.items.some((item) => item.type === "shared" && item.splitWith.length === 0)) return "Falta elegir quienes lo dividen";
    return "Revisa la cuenta";
  }

  function paidReady() {
    if (state.paidMode === "none") {
      if (!state.paymentMethod) return false;
      if (state.paymentMethod === "card") return Boolean(state.cardPayerId);
      return true;
    }
    if (state.paidMode === "single") return Boolean(state.paidById) && Boolean(state.paymentMethod);
    if (state.paidMode === "multiple") return state.items.every((item) => Boolean(item.paidById));
    return false;
  }

  function paidMessage() {
    if (!state.paidMode) return "Elige una opcion";
    if (state.paidMode === "none" && !state.paymentMethod) return "Elige efectivo o tarjeta";
    if (state.paidMode === "none" && state.paymentMethod === "card" && !state.cardPayerId) return "Elige quien pondra la tarjeta";
    if (state.paidMode === "single" && !state.paidById) return "Elige quien pago";
    if (state.paidMode === "single" && !state.paymentMethod) return "Elige como pago";
    if (state.paidMode === "multiple") return "Falta marcar quien pago";
    return "Calcular cuenta";
  }

  function openPersonEdit(personId) {
    const person = findPerson(personId);
    if (!person) return;
    state.editing = { type: "person", id: personId };
    openSheet("Editar persona", `
      <label class="field">
        <span>Nombre</span>
        <input name="personName" type="text" value="${escapeAttr(person.name)}" autocomplete="off">
      </label>
      <label class="toggle-line">
        <input name="isGuest" type="checkbox" ${person.isGuest ? "checked" : ""}>
        <span>Es invitado o cumpleanero y no paga</span>
      </label>
    `, `
      <button class="primary-button" type="submit">Guardar cambios</button>
      <button class="danger-button" type="button" data-sheet-remove>Eliminar persona</button>
    `);
  }

  function openItemEdit(itemId) {
    const item = findItem(itemId);
    if (!item) return;
    state.editing = { type: "item", id: itemId };
    openSheet(editTitle(item), editBody(item), `
      <button class="primary-button" type="submit">Guardar cambios</button>
      <button class="danger-button" type="button" data-sheet-remove>Eliminar ${escapeHtml(itemDeleteName(item))}</button>
    `);
  }

  function editTitle(item) {
    if (item.type === "shared") return "Editar gasto para todos";
    if (item.type === "single") return "Editar gasto de una persona";
    return "Editar producto";
  }

  function editBody(item) {
    const base = `
      <label class="field">
        <span>${item.type === "product" ? "Producto" : "Nombre del gasto"}</span>
        <input name="itemName" type="text" value="${escapeAttr(item.name)}" autocomplete="off">
      </label>
      <label class="field">
        <span>Monto</span>
        <input name="itemAmount" type="number" min="0" step="0.01" inputmode="decimal" value="${(item.amountCents / 100).toFixed(2)}">
      </label>
    `;

    if (item.type === "product") {
      return `${base}
        <div class="field">
          <span>Quien comio esto</span>
          <div class="person-picker">
            ${state.people.map((person) => renderPickButton(person, item.eatenBy, `data-sheet-person="${person.id}"`)).join("")}
          </div>
        </div>
      `;
    }

    if (item.type === "shared") {
      return `${base}
        <div class="field">
          <span>Quienes dividen esto</span>
          <div class="person-picker">
            ${state.people.map((person) => renderPickButton(person, item.splitWith, `data-sheet-person="${person.id}"`)).join("")}
          </div>
        </div>
      `;
    }

    return `${base}
      <label class="field">
        <span>De quien es</span>
        <select name="ownerId">${personOptions(item.ownerId)}</select>
      </label>
      <label class="field">
        <span>Quien lo pago</span>
        <select name="paidById">${personOptions(item.paidById)}</select>
      </label>
    `;
  }

  function openSheet(title, body, actions) {
    els.sheetTitle.textContent = title;
    els.sheetBody.innerHTML = body;
    els.sheetActions.innerHTML = actions;
    els.sheetActions.querySelector("[data-sheet-remove]")?.addEventListener("click", removeEditingItem);
    els.sheetBody.querySelectorAll("[data-sheet-person]").forEach((button) => {
      button.addEventListener("click", () => button.classList.toggle("active"));
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
      const person = findPerson(state.editing.id);
      if (!person) return closeSheet();
      const name = sanitizeText(els.editForm.elements.personName.value, 40);
      if (!name) return showToast("Falta el nombre");
      person.name = name;
      person.isGuest = Boolean(els.editForm.elements.isGuest.checked);
      syncSharedSplits();
    }

    if (state.editing.type === "item") {
      const item = findItem(state.editing.id);
      if (!item) return closeSheet();
      const name = sanitizeText(els.editForm.elements.itemName.value, 60);
      const amountCents = toCents(els.editForm.elements.itemAmount.value);
      if (!name) return showToast(item.type === "product" ? "Falta el producto" : "Falta el nombre");
      if (amountCents <= 0) return showToast("Ponle un precio");
      item.name = name;
      item.amountCents = amountCents;
      if (item.type === "product") {
        item.eatenBy = selectedSheetPeople();
      }
      if (item.type === "shared") {
        item.splitWith = selectedSheetPeople();
      }
      if (item.type === "single") {
        item.ownerId = els.editForm.elements.ownerId.value;
        item.paidById = els.editForm.elements.paidById.value;
      }
    }

    closeSheet();
    showToast("Listo, se actualizo");
    render();
  }

  function selectedSheetPeople() {
    return Array.from(els.sheetBody.querySelectorAll("[data-sheet-person].active")).map((button) => button.dataset.sheetPerson);
  }

  function removeEditingItem() {
    if (!state.editing) return;
    if (state.editing.type === "person") removePerson(state.editing.id, true);
    if (state.editing.type === "item") removeItem(state.editing.id, true);
    closeSheet();
  }

  function removePerson(personId, skipConfirm = false) {
    if (!skipConfirm && !confirm("Quitar a esta persona?")) return;
    state.people = state.people.filter((person) => person.id !== personId);
    state.items.forEach((item) => {
      if (item.type === "product") item.eatenBy = item.eatenBy.filter((id) => id !== personId);
      if (item.type === "shared") item.splitWith = item.splitWith.filter((id) => id !== personId);
      if (item.type === "single") {
        if (item.ownerId === personId) item.ownerId = state.people[0]?.id || "";
        if (item.paidById === personId) item.paidById = state.people[0]?.id || "";
      }
      if (item.paidById === personId) item.paidById = "";
    });
    if (state.paidById === personId) state.paidById = "";
    if (state.cardPayerId === personId) state.cardPayerId = "";
    syncSharedSplits();
    render();
  }

  function removeItem(itemId, skipConfirm = false) {
    if (!skipConfirm && !confirm("Quitar esto de la cuenta?")) return;
    state.items = state.items.filter((item) => item.id !== itemId);
    render();
  }

  function duplicateItem(itemId) {
    const item = findItem(itemId);
    if (!item) return;
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = createId(item.type);
    state.items.push(copy);
    showToast("Agregado otro igual");
    render();
  }

  function toggleGuest(personId) {
    const person = findPerson(personId);
    if (!person) return;
    person.isGuest = !person.isGuest;
    syncSharedSplits();
    render();
  }

  function toggleEater(itemId, personId) {
    const item = findItem(itemId);
    if (!item || item.type !== "product") return;
    item.eatenBy = item.eatenBy.includes(personId)
      ? item.eatenBy.filter((id) => id !== personId)
      : [...item.eatenBy, personId];
    render();
  }

  function selectAllEaters(itemId) {
    const item = findItem(itemId);
    if (!item || item.type !== "product") return;
    item.eatenBy = state.people.map((person) => person.id);
    render();
  }

  function setPaidMode(mode) {
    state.paidMode = mode;
    if (mode !== "single") state.paidById = "";
    if (mode === "multiple") {
      state.paymentMethod = "";
      state.cardPayerId = "";
    }
    if (mode === "single") state.cardPayerId = "";
    if (mode === "multiple") {
      state.items.forEach((item) => {
        if (item.type === "single" && item.paidById) return;
        item.paidById = item.paidById || "";
      });
    }
    render();
  }

  function setPaymentMethod(method) {
    state.paymentMethod = method;
    if (method !== "card") state.cardPayerId = "";
    render();
  }

  function setCardPayer(personId) {
    state.cardPayerId = personId;
    render();
  }

  function setPaidBy(personId) {
    state.paidById = personId;
    render();
  }

  function setItemPaidBy(itemId, personId) {
    const item = findItem(itemId);
    if (!item) return;
    item.paidById = personId;
    render();
  }

  function syncSharedSplits() {
    const payerIds = payers().map((person) => person.id);
    state.items.forEach((item) => {
      if (item.type === "shared" && item.splitWith.length === 0) item.splitWith = [...payerIds];
      if (item.type === "shared") item.splitWith = item.splitWith.filter((id) => state.people.some((person) => person.id === id));
    });
  }

  function calculateResult() {
    if (state.paidMode === "none") {
      if (state.paymentMethod === "card" && state.cardPayerId) {
        const settlements = window.ClaraCore.calculateClaramenteSettlements(state);
        const cards = settlements.map((payment) => ({
          kind: "owe",
          text: `${personName(payment.from)} le paga ${formatMoney(payment.amountCents)} a ${personName(payment.to)}`
        }));

        return {
          help: `${personName(state.cardPayerId)} pondra la tarjeta. Los demas le pagan su parte.`,
          cards: withReceipts(cards, settlements)
        };
      }

      const contributions = window.ClaraCore.calculateClaramenteContributions(state);
      const cards = state.people
        .map((person) => {
          const amount = contributions.get(person.id) || 0;
          if (person.isGuest) return { kind: "neutral", text: `${person.name} no paga esta vez` };
          return amount > 0 ? { kind: "owe", text: `${person.name} aporta ${formatMoney(amount)}` } : null;
        })
        .filter(Boolean);

      return {
        help: "Cada quien aporta su parte antes de pagar.",
        cards: cards.length ? cards : [{ kind: "neutral", text: "No hay pagos pendientes." }]
      };
    }

    const settlements = window.ClaraCore.calculateClaramenteSettlements(state);
    const cards = settlements.map((payment) => ({
      kind: "owe",
      text: `${personName(payment.from)} le paga ${formatMoney(payment.amountCents)} a ${personName(payment.to)}`
    }));

    return {
      help: "Estos son los pagos sugeridos.",
      cards: withReceipts(cards, settlements)
    };
  }

  function withReceipts(cards, settlements) {
    const receipts = receiveCards(settlements);
    const visible = cards.concat(receipts);
    return visible.length ? visible : [{ kind: "neutral", text: "No hay pagos pendientes." }];
  }

  function receiveCards(settlements) {
    const totals = new Map();
    settlements.forEach((payment) => {
      if (!payment || payment.amountCents <= 0) return;
      totals.set(payment.to, (totals.get(payment.to) || 0) + payment.amountCents);
    });
    return state.people
      .map((person) => {
        const amountCents = totals.get(person.id) || 0;
        if (amountCents <= 0) return null;
        return { kind: "receive", text: `${person.name} recibe ${formatMoney(amountCents)}` };
      })
      .filter(Boolean);
  }

  function savedAccountButton() {
    if (persistEnabled) return "";
    const buttons = [];
    if (savedGuided || savedCanonical) {
      buttons.push(`<button class="secondary-button" type="button" data-open-saved>Abrir cuenta guardada</button>`);
    }
    if (savedGuided && savedCanonical && syncChoice.action === "keep") {
      buttons.push(`<button class="secondary-button" type="button" data-bring-canonical>Traer la cuenta de este celular</button>`);
    }
    return buttons.join("");
  }

  function domainSnapshot() {
    return {
      people: domain.people,
      items: domain.items,
      paidMode: domain.paidMode,
      paymentMethod: domain.paymentMethod,
      cardPayerId: domain.cardPayerId,
      paidById: domain.paidById,
      billId: domain.billId,
      claims: domain.claims,
      updatedAt: domain.updatedAt
    };
  }

  function sameBill(left, right) {
    if (!left || !right) return false;
    const rest = (value) => JSON.stringify({
      people: value.people,
      items: value.items,
      paidMode: value.paidMode,
      paymentMethod: value.paymentMethod,
      cardPayerId: value.cardPayerId,
      paidById: value.paidById,
      billId: value.billId,
      claims: value.claims
    });
    return rest(left) === rest(right);
  }

  function applyDomain(next) {
    domain.people = next.people;
    domain.items = next.items;
    domain.paidMode = next.paidMode;
    domain.paymentMethod = next.paymentMethod;
    domain.cardPayerId = next.cardPayerId;
    domain.paidById = next.paidById;
    domain.billId = next.billId || "";
    domain.claims = next.claims || {};
    domain.updatedAt = Number.isInteger(next.updatedAt) ? next.updatedAt : 0;
  }

  function beginSession(next) {
    if (next) applyDomain(next);
    persistEnabled = true;
    persistDomain.last = domainSnapshot();
  }

  function demoBill() {
    return {
      people: [
        { id: "p_ana", name: "Ana" },
        { id: "p_luis", name: "Luis" }
      ],
      items: [
        { id: "item_tacos", type: "product", name: "Tacos", amountCents: 18000, eatenBy: [], paidById: "p_ana" },
        { id: "item_pizza", type: "product", name: "Pizza", amountCents: 24000, eatenBy: [], paidById: "p_ana" }
      ],
      paidMode: "single",
      paymentMethod: "card",
      cardPayerId: "p_ana",
      paidById: "p_ana",
      billId: "mesa_prueba",
      claims: {},
      updatedAt: 1
    };
  }

  function persistDomain() {
    if (demoMode || state.screen === "guest" || !persistEnabled || !window.ClaraStore) return;
    const snapshot = domainSnapshot();
    if (!sameBill(persistDomain.last, snapshot)) snapshot.updatedAt = Date.now();
    else snapshot.updatedAt = persistDomain.last ? persistDomain.last.updatedAt : snapshot.updatedAt;
    domain.updatedAt = snapshot.updatedAt;
    persistDomain.last = snapshot;
    try {
      window.ClaraStore.saveGuided(window.localStorage, snapshot);
      const decision = window.ClaraStore.syncCanonicalFromGuided(window.localStorage, snapshot);
      if (decision.action === "keep" && decision.reason !== "empty" && !persistDomain.told) {
        persistDomain.told = true;
        showToast("Deje la otra cuenta de este celular como estaba");
      }
    } catch (error) {
      if (persistDomain.warned) return;
      persistDomain.warned = true;
      showToast("No pude guardar en este celular");
    }
  }

  function openSavedAccount() {
    const next = savedGuided || savedCanonical;
    if (!next) return;
    beginSession(next);
    goTo(domain.items.length ? "items" : "people");
    showToast("Listo, se abrio tu cuenta");
  }

  function bringCanonicalAccount() {
    if (!savedCanonical) return;
    beginSession(savedCanonical);
    goTo(domain.items.length ? "items" : "people");
    showToast("Listo, traje la cuenta de este celular");
  }

  function calculateContributions() {
    const totals = new Map(state.people.map((person) => [person.id, 0]));
    state.items.forEach((item) => {
      const chargedIds = chargedPeopleFor(item);
      distribute(item.amountCents, chargedIds).forEach((amount, personId) => {
        totals.set(personId, (totals.get(personId) || 0) + amount);
      });
    });
    return totals;
  }

  function calculateBalances() {
    const balances = new Map(state.people.map((person) => [person.id, 0]));
    state.items.forEach((item) => {
      const paidBy = state.paidMode === "single" ? state.paidById : item.paidById;
      if (!paidBy) return;
      balances.set(paidBy, (balances.get(paidBy) || 0) + item.amountCents);
      distribute(item.amountCents, chargedPeopleFor(item)).forEach((amount, personId) => {
        balances.set(personId, (balances.get(personId) || 0) - amount);
      });
    });
    return balances;
  }

  function chargedPeopleFor(item) {
    const payerIds = payers().map((person) => person.id);
    if (item.type === "product") {
      const chargedIds = nonGuestIds(item.eatenBy);
      return chargedIds.length ? chargedIds : payerIds;
    }
    if (item.type === "shared") {
      const chargedIds = nonGuestIds(item.splitWith);
      return chargedIds.length ? chargedIds : payerIds;
    }
    if (item.type === "single") {
      const owner = findPerson(item.ownerId);
      if (owner && !owner.isGuest) return [owner.id];
      return payerIds;
    }
    return [];
  }

  function nonGuestIds(ids) {
    return ids.filter((id) => {
      const person = findPerson(id);
      return person && !person.isGuest;
    });
  }

  function distribute(amountCents, ids) {
    const result = new Map();
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    if (!uniqueIds.length) return result;
    const base = Math.floor(amountCents / uniqueIds.length);
    let remainder = amountCents - base * uniqueIds.length;
    uniqueIds.forEach((id) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      result.set(id, base + extra);
    });
    return result;
  }

  function settleBalances(balances) {
    const debtors = [];
    const creditors = [];
    balances.forEach((amount, personId) => {
      if (amount < 0) debtors.push({ personId, amount: -amount });
      if (amount > 0) creditors.push({ personId, amount });
    });

    const payments = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.amount, creditor.amount);
      if (amount > 0) payments.push({ from: debtor.personId, to: creditor.personId, amount });
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount === 0) debtorIndex += 1;
      if (creditor.amount === 0) creditorIndex += 1;
    }

    return payments;
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

  function showFieldError(error, input, message) {
    error.textContent = message;
    input.focus();
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function payers() {
    return state.people.filter((person) => !person.isGuest);
  }

  function findPerson(personId) {
    return state.people.find((person) => person.id === personId);
  }

  function findItem(itemId) {
    return state.items.find((item) => item.id === itemId);
  }

  function namesFor(ids) {
    return ids.map(personName).join(", ") || "Falta elegir";
  }

  function personName(personId) {
    return findPerson(personId)?.name || "Persona";
  }

  function personOptions(selectedId = "") {
    return state.people.map((person) => `
      <option value="${escapeAttr(person.id)}" ${selectedId === person.id ? "selected" : ""}>${escapeHtml(person.name)}</option>
    `).join("");
  }

  function itemLabel(item) {
    if (item.type === "shared") return "Gasto para todos";
    if (item.type === "single") return `De ${personName(item.ownerId)}`;
    return "Producto";
  }

  function itemDeleteName(item) {
    if (item.type === "product") return "producto";
    return "gasto";
  }

  function icon(name) {
    const path = iconPaths[name] || iconPaths.coin;
    return `<svg class="mono-icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
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
