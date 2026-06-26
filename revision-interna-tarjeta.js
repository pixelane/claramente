(function() {
  "use strict";

  const moneyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  });

  const state = {
    people: [
      { id: "p_jimmy", name: "Jimmy", isGuest: false },
      { id: "p_tarjeta", name: "Tarjeta", isGuest: true },
      { id: "p_cash", name: "Cash", isGuest: false }
    ],
    items: [
      {
        id: "shared_cuenta",
        type: "shared",
        name: "Cuenta",
        amountCents: 520000,
        splitWith: ["p_jimmy", "p_tarjeta", "p_cash"]
      }
    ],
    paidMode: "none",
    paidById: "",
    paymentMethod: "card",
    cardPayerId: "p_tarjeta"
  };

  document.addEventListener("DOMContentLoaded", render);

  function render() {
    const cashState = { ...state, paymentMethod: "cash", cardPayerId: "" };
    const contributions = window.ClaraCore.calculateClaramenteContributions(cashState);
    const cashLines = state.people
      .filter((person) => !person.isGuest)
      .map((person) => `${person.name} aporta ${formatMoney(contributions.get(person.id) || 0)}`);

    const cardPayments = window.ClaraCore.calculateClaramenteSettlements(state);
    const cardLines = cardPayments.map((payment) => (
      `${personName(payment.from)} le paga ${formatMoney(payment.amountCents)} a ${personName(payment.to)}`
    ));

    document.getElementById("cashResult").innerHTML = renderCards(cashLines, "owe");
    document.getElementById("cardResult").innerHTML = renderCards(cardLines, "owe");
    document.getElementById("summaryText").textContent = ["claramente", ...cardLines].join("\n");
    document.getElementById("copySummaryBtn").addEventListener("click", copySummary);
  }

  function renderCards(lines, kind) {
    return lines.map((line) => `
      <article class="result-card ${kind}">
        <p>${escapeHtml(line)}</p>
      </article>
    `).join("");
  }

  async function copySummary() {
    const text = document.getElementById("summaryText").textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast("Resumen copiado");
      return;
    }
    showToast("Selecciona el texto y copialo manualmente");
  }

  function personName(personId) {
    return state.people.find((person) => person.id === personId)?.name || "Persona";
  }

  function formatMoney(cents) {
    return moneyFormatter.format((cents || 0) / 100);
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
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
})();
