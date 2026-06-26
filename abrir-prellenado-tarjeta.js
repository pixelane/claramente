(function() {
  "use strict";

  const state = {
    screen: "people",
    itemMode: "shared",
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
    paymentMethod: "card",
    cardPayerId: "p_tarjeta"
  };

  const url = new URL("claramente.html", window.location.href);
  url.searchParams.set("shell", "claramente");
  url.hash = toBase64Url(new TextEncoder().encode(JSON.stringify(state)));

  document.addEventListener("DOMContentLoaded", () => {
    const link = document.getElementById("openPrefilledLink");
    if (link) link.href = url.href;
    window.location.replace(url.href);
  });

  function toBase64Url(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
})();
