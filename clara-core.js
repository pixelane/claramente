(function(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ClaraCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  function calculateSettlements(state) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const expenses = Array.isArray(state && state.expenses) ? state.expenses : [];
    const balances = new Map(people.map((person) => [person.id, 0]));
    const guestIds = new Set(people.filter((person) => person.isGuest).map((person) => person.id));

    for (const expense of expenses) {
      const validSplit = Array.isArray(expense.splitWith)
        ? expense.splitWith.filter((id) => balances.has(id))
        : [];
      if (!balances.has(expense.paidBy) || !validSplit.length) continue;
      balances.set(expense.paidBy, balances.get(expense.paidBy) + expense.amountCents);
      const payingSplit = validSplit.filter((id) => !guestIds.has(id));
      const effectiveSplit = payingSplit.length ? payingSplit : validSplit;
      distribute(expense.amountCents, effectiveSplit).forEach((amount, personId) => {
        balances.set(personId, balances.get(personId) - amount);
      });
    }

    return {
      balances,
      settlements: settleBalances(balances)
    };
  }

  function claramenteToClaraState(state) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const items = Array.isArray(state && state.items) ? state.items : [];
    const canonicalState = {
      version: 1,
      groupName: "",
      currency: "MXN",
      people: people.map((person) => ({
        id: person.id,
        name: person.name,
        reminder: person.reminder || "",
        isGuest: Boolean(person.isGuest)
      })),
      expenses: [],
      tableClose: {},
      updatedAt: 0
    };

    if (state && state.paidMode === "none") {
      calculateClaramenteContributions(state).forEach((amountCents, personId) => {
        if (amountCents <= 0) return;
        canonicalState.expenses.push({
          id: `claramente-none-${personId}`,
          description: "Aportacion antes de pagar",
          amountCents,
          paidBy: personId,
          splitWith: [personId],
          createdAt: canonicalState.expenses.length + 1,
          source: "restaurant",
          restaurantId: "claramente-none",
          restaurantPaidBy: "__self__",
          payerShareCents: amountCents,
          restaurantName: "Claramente"
        });
      });
      return canonicalState;
    }

    canonicalState.expenses = items
      .map((item, index) => {
        const paidBy = state && state.paidMode === "single" ? state.paidById : item.paidById;
        return {
          id: item.id || `claramente-item-${index + 1}`,
          description: item.name || "Gasto",
          amountCents: item.amountCents,
          paidBy,
          splitWith: claramenteSplitPeopleFor(state, item),
          createdAt: index + 1
        };
      })
      .filter((expense) => expense.amountCents > 0 && expense.paidBy && expense.splitWith.length > 0);

    return canonicalState;
  }

  function calculateClaramenteContributions(state) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const items = Array.isArray(state && state.items) ? state.items : [];
    const totals = new Map(people.map((person) => [person.id, 0]));
    items.forEach((item) => {
      distribute(item.amountCents, claramenteChargedPeopleFor(state, item)).forEach((amount, personId) => {
        totals.set(personId, (totals.get(personId) || 0) + amount);
      });
    });
    return totals;
  }

  function calculateClaramenteSettlements(state) {
    if (state && state.paidMode === "none" && state.paymentMethod === "card" && state.cardPayerId) {
      return calculateClaramenteCardSettlements(state);
    }
    return calculateSettlements(claramenteToClaraState(state)).settlements;
  }

  function calculateClaramenteCardSettlements(state) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const peopleIds = new Set(people.map((person) => person.id));
    if (!peopleIds.has(state.cardPayerId)) return [];
    const contributions = calculateClaramenteContributions(state);
    return people
      .filter((person) => person.id !== state.cardPayerId && !person.isGuest)
      .map((person) => ({
        from: person.id,
        to: state.cardPayerId,
        amountCents: contributions.get(person.id) || 0
      }))
      .filter((payment) => payment.amountCents > 0);
  }

  function claramenteChargedPeopleFor(state, item) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const payerIds = people.filter((person) => !person.isGuest).map((person) => person.id);
    if (!item) return [];
    if (item.type === "product") {
      const chargedIds = claramenteNonGuestIds(people, item.eatenBy);
      return chargedIds.length ? chargedIds : payerIds;
    }
    if (item.type === "shared") {
      const chargedIds = claramenteNonGuestIds(people, item.splitWith);
      return chargedIds.length ? chargedIds : payerIds;
    }
    if (item.type === "single") {
      const owner = people.find((person) => person.id === item.ownerId);
      if (owner && !owner.isGuest) return [owner.id];
      return payerIds;
    }
    return [];
  }


  function claramenteSplitPeopleFor(state, item) {
    const people = Array.isArray(state && state.people) ? state.people : [];
    const payerIds = people.filter((person) => !person.isGuest).map((person) => person.id);
    if (!item) return [];
    if (item.type === "product") {
      const selectedIds = claramenteValidIds(people, item.eatenBy);
      return claramenteNonGuestIds(people, selectedIds).length ? selectedIds : payerIds;
    }
    if (item.type === "shared") {
      const selectedIds = claramenteValidIds(people, item.splitWith);
      return claramenteNonGuestIds(people, selectedIds).length ? selectedIds : payerIds;
    }
    if (item.type === "single") {
      const owner = people.find((person) => person.id === item.ownerId);
      if (owner && !owner.isGuest) return [owner.id];
      return payerIds;
    }
    return [];
  }

  function claramenteValidIds(people, ids) {
    const peopleIds = new Set(people.map((person) => person.id));
    return Array.isArray(ids) ? Array.from(new Set(ids)).filter((id) => peopleIds.has(id)) : [];
  }

  function claramenteNonGuestIds(people, ids) {
    const peopleById = new Map(people.map((person) => [person.id, person]));
    return Array.isArray(ids)
      ? ids.filter((id) => {
        const person = peopleById.get(id);
        return person && !person.isGuest;
      })
      : [];
  }

  function distribute(amountCents, ids) {
    const result = new Map();
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    if (!uniqueIds.length) return result;
    const baseShare = Math.floor(amountCents / uniqueIds.length);
    let remainder = amountCents - baseShare * uniqueIds.length;
    uniqueIds.forEach((personId) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      result.set(personId, baseShare + extra);
    });
    return result;
  }

  function settleBalances(balances) {
    const debtors = [];
    const creditors = [];
    for (const [id, amount] of balances.entries()) {
      if (amount < 0) debtors.push({ id, amount: -amount });
      if (amount > 0) creditors.push({ id, amount });
    }

    const settlements = [];
    let debtIndex = 0;
    let creditIndex = 0;
    while (debtIndex < debtors.length && creditIndex < creditors.length) {
      const debtor = debtors[debtIndex];
      const creditor = creditors[creditIndex];
      const amount = Math.min(debtor.amount, creditor.amount);
      if (amount > 0) {
        settlements.push({ from: debtor.id, to: creditor.id, amountCents: amount });
      }
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount === 0) debtIndex += 1;
      if (creditor.amount === 0) creditIndex += 1;
    }
    return settlements;
  }

  const PAID_MODES = new Set(["", "none", "single", "multiple"]);
  const ITEM_TYPES = new Set(["product", "shared", "single"]);
  const PAYMENT_METHODS = new Set(["", "cash", "card"]);
  const CURRENCIES = new Set(["MXN", "USD", "EUR", "COP", "ARS", "CLP"]);
  const UI_ONLY_KEYS = ["screen", "itemMode", "editing"];

  function cleanText(value, maxLength) {
    const text = typeof value === "string" ? value.trim() : "";
    return text.slice(0, maxLength);
  }

  function positiveInteger(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(number) || number <= 0) return 0;
    return number;
  }

  function nonNegativeInteger(value, fallback) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(number) || number < 0) return fallback;
    return number;
  }

  function uniqueStrings(ids) {
    if (!Array.isArray(ids)) return [];
    return Array.from(new Set(ids.filter((id) => typeof id === "string" && id)));
  }

  function normalizePeople(rawPeople) {
    const people = [];
    const seen = new Set();
    if (!Array.isArray(rawPeople)) return people;
    rawPeople.forEach((person) => {
      if (!person || typeof person !== "object") return;
      const id = typeof person.id === "string" ? person.id : "";
      const name = cleanText(person.name, 80);
      if (!id || !name || seen.has(id)) return;
      seen.add(id);
      people.push({
        id,
        name,
        reminder: cleanText(person.reminder, 240),
        isGuest: Boolean(person.isGuest)
      });
    });
    return people;
  }

  function normalizeCanonicalState(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const people = normalizePeople(source.people);
    const peopleIds = new Set(people.map((person) => person.id));
    const expenses = [];
    const seenExpenseIds = new Set();
    if (Array.isArray(source.expenses)) {
      source.expenses.forEach((expense, index) => {
        if (!expense || typeof expense !== "object") return;
        const amountCents = positiveInteger(expense.amountCents);
        const paidBy = typeof expense.paidBy === "string" ? expense.paidBy : "";
        const splitWith = uniqueStrings(expense.splitWith).filter((id) => peopleIds.has(id));
        if (!amountCents || !peopleIds.has(paidBy) || !splitWith.length) return;
        let id = typeof expense.id === "string" && expense.id ? expense.id : `expense-${index + 1}`;
        if (seenExpenseIds.has(id)) id = `${id}-${index + 1}`;
        seenExpenseIds.add(id);
        const normalized = {
          id,
          description: cleanText(expense.description, 120) || "Gasto",
          amountCents,
          paidBy,
          splitWith,
          createdAt: nonNegativeInteger(expense.createdAt, index + 1)
        };
        if (expense.source === "restaurant") {
          normalized.source = "restaurant";
          if (typeof expense.restaurantId === "string" && expense.restaurantId) {
            normalized.restaurantId = expense.restaurantId;
          }
          if (expense.restaurantPaidBy === "__self__" || peopleIds.has(expense.restaurantPaidBy)) {
            normalized.restaurantPaidBy = expense.restaurantPaidBy;
          }
          if (Number.isInteger(expense.payerShareCents) && expense.payerShareCents >= 0) {
            normalized.payerShareCents = expense.payerShareCents;
          }
          if (typeof expense.restaurantName === "string") {
            normalized.restaurantName = cleanText(expense.restaurantName, 80);
          }
        }
        expenses.push(normalized);
      });
    }
    const tableClose = {};
    if (source.tableClose && typeof source.tableClose === "object" && !Array.isArray(source.tableClose)) {
      Object.keys(source.tableClose).forEach((key) => {
        const record = source.tableClose[key];
        if (!record || !Number.isInteger(record.paidCents) || record.paidCents < 0) return;
        tableClose[key] = { paidCents: record.paidCents };
      });
    }
    return {
      version: 1,
      groupName: cleanText(source.groupName, 80),
      currency: CURRENCIES.has(source.currency) ? source.currency : "MXN",
      people,
      expenses,
      tableClose,
      updatedAt: nonNegativeInteger(source.updatedAt, 0)
    };
  }

  function normalizeClaramenteItem(item, peopleIds, index, seenIds) {
    if (!item || typeof item !== "object" || !ITEM_TYPES.has(item.type)) return null;
    const amountCents = positiveInteger(item.amountCents);
    if (!amountCents) return null;
    let id = typeof item.id === "string" && item.id ? item.id : `item-${index + 1}`;
    if (seenIds.has(id)) id = `${id}-${index + 1}`;
    const name = cleanText(item.name, 120) || "Gasto";
    if (item.type === "product") {
      return {
        id,
        type: "product",
        name,
        amountCents,
        eatenBy: uniqueStrings(item.eatenBy).filter((personId) => peopleIds.has(personId))
      };
    }
    if (item.type === "shared") {
      return {
        id,
        type: "shared",
        name,
        amountCents,
        splitWith: uniqueStrings(item.splitWith).filter((personId) => peopleIds.has(personId))
      };
    }
    if (!peopleIds.has(item.ownerId)) return null;
    return {
      id,
      type: "single",
      name,
      amountCents,
      ownerId: item.ownerId,
      paidById: peopleIds.has(item.paidById) ? item.paidById : ""
    };
  }

  function normalizeClaramenteState(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const people = normalizePeople(source.people).map((person) => ({
      id: person.id,
      name: person.name,
      isGuest: person.isGuest
    }));
    const peopleIds = new Set(people.map((person) => person.id));
    const items = [];
    const seenIds = new Set();
    if (Array.isArray(source.items)) {
      source.items.forEach((item, index) => {
        const normalized = normalizeClaramenteItem(item, peopleIds, index, seenIds);
        if (!normalized) return;
        seenIds.add(normalized.id);
        items.push(normalized);
      });
    }
    return {
      people,
      items,
      paidMode: PAID_MODES.has(source.paidMode) ? source.paidMode : "",
      paymentMethod: PAYMENT_METHODS.has(source.paymentMethod) ? source.paymentMethod : "",
      cardPayerId: peopleIds.has(source.cardPayerId) ? source.cardPayerId : "",
      paidById: peopleIds.has(source.paidById) ? source.paidById : ""
    };
  }

  function validateCanonicalState(raw) {
    const errors = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return ["El estado canonico no es un objeto"];
    }
    if (raw.version !== 1) errors.push("version debe ser 1");
    if (raw.currency !== undefined && !CURRENCIES.has(raw.currency)) errors.push("currency no esta soportada");
    if (!Array.isArray(raw.people)) {
      errors.push("people debe ser una lista");
    } else {
      const seen = new Set();
      raw.people.forEach((person, index) => {
        if (!person || typeof person.id !== "string" || !person.id) {
          errors.push(`people[${index}] no tiene id`);
        } else if (seen.has(person.id)) {
          errors.push(`people id duplicado: ${person.id}`);
        } else {
          seen.add(person.id);
        }
        if (!person || typeof person.name !== "string" || !person.name.trim()) {
          errors.push(`people[${index}] no tiene nombre`);
        }
      });
    }
    const peopleIds = new Set(Array.isArray(raw.people) ? raw.people.map((person) => person && person.id).filter(Boolean) : []);
    if (!Array.isArray(raw.expenses)) {
      errors.push("expenses debe ser una lista");
    } else {
      const seen = new Set();
      raw.expenses.forEach((expense, index) => {
        const label = `expenses[${index}]`;
        if (!expense || typeof expense !== "object") {
          errors.push(`${label} no es un objeto`);
          return;
        }
        if (typeof expense.id !== "string" || !expense.id) errors.push(`${label} no tiene id`);
        else if (seen.has(expense.id)) errors.push(`expenses id duplicado: ${expense.id}`);
        else seen.add(expense.id);
        if (!Number.isInteger(expense.amountCents) || expense.amountCents <= 0) {
          errors.push(`${label} amountCents debe ser un entero positivo`);
        }
        if (!peopleIds.has(expense.paidBy)) errors.push(`${label} paidBy no existe`);
        if (!Array.isArray(expense.splitWith) || expense.splitWith.length === 0) {
          errors.push(`${label} splitWith esta vacio`);
        } else {
          if (new Set(expense.splitWith).size !== expense.splitWith.length) {
            errors.push(`${label} splitWith tiene duplicados`);
          }
          expense.splitWith.forEach((id) => {
            if (!peopleIds.has(id)) errors.push(`${label} splitWith incluye un id desconocido`);
          });
        }
      });
    }
    if (raw.tableClose && typeof raw.tableClose === "object" && !Array.isArray(raw.tableClose)) {
      Object.keys(raw.tableClose).forEach((key) => {
        const record = raw.tableClose[key];
        if (!record || !Number.isInteger(record.paidCents) || record.paidCents < 0) {
          errors.push(`tableClose.${key} paidCents debe ser un entero mayor o igual a 0`);
        }
      });
    }
    return errors;
  }

  function validateClaramenteState(raw) {
    const errors = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return ["El estado de Claramente no es un objeto"];
    }
    UI_ONLY_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        errors.push(`${key} es estado de interfaz y no debe persistirse`);
      }
    });
    if (!Array.isArray(raw.people)) {
      errors.push("people debe ser una lista");
    }
    const peopleIds = new Set();
    (Array.isArray(raw.people) ? raw.people : []).forEach((person, index) => {
      if (!person || typeof person.id !== "string" || !person.id) {
        errors.push(`people[${index}] no tiene id`);
        return;
      }
      if (peopleIds.has(person.id)) errors.push(`people id duplicado: ${person.id}`);
      peopleIds.add(person.id);
      if (typeof person.name !== "string" || !person.name.trim()) errors.push(`people[${index}] no tiene nombre`);
    });
    if (!Array.isArray(raw.items)) {
      errors.push("items debe ser una lista");
    } else {
      const seen = new Set();
      raw.items.forEach((item, index) => {
        const label = `items[${index}]`;
        if (!item || !ITEM_TYPES.has(item.type)) {
          errors.push(`${label} tiene un tipo invalido`);
          return;
        }
        if (typeof item.id !== "string" || !item.id) errors.push(`${label} no tiene id`);
        else if (seen.has(item.id)) errors.push(`items id duplicado: ${item.id}`);
        else seen.add(item.id);
        if (!Number.isInteger(item.amountCents) || item.amountCents <= 0) {
          errors.push(`${label} amountCents debe ser un entero positivo`);
        }
        const checkIds = (ids, field) => {
          if (!Array.isArray(ids)) {
            errors.push(`${label} ${field} debe ser una lista`);
            return;
          }
          if (new Set(ids).size !== ids.length) errors.push(`${label} ${field} tiene duplicados`);
          ids.forEach((id) => {
            if (!peopleIds.has(id)) errors.push(`${label} ${field} incluye un id desconocido`);
          });
        };
        if (item.type === "product") checkIds(item.eatenBy, "eatenBy");
        if (item.type === "shared") checkIds(item.splitWith, "splitWith");
        if (item.type === "single") {
          if (!peopleIds.has(item.ownerId)) errors.push(`${label} ownerId no existe`);
          if (item.paidById && !peopleIds.has(item.paidById)) errors.push(`${label} paidById no existe`);
        }
      });
    }
    if (raw.paidMode !== undefined && !PAID_MODES.has(raw.paidMode)) errors.push("paidMode no es valido");
    if (raw.paymentMethod !== undefined && !PAYMENT_METHODS.has(raw.paymentMethod)) errors.push("paymentMethod no es valido");
    if (raw.paidById && !peopleIds.has(raw.paidById)) errors.push("paidById no existe");
    if (raw.cardPayerId && !peopleIds.has(raw.cardPayerId)) errors.push("cardPayerId no existe");
    return errors;
  }

  function isSelfContribution(expense) {
    return expense.restaurantPaidBy === "__self__"
      || (
        expense.source === "restaurant"
        && Array.isArray(expense.splitWith)
        && expense.splitWith.length === 1
        && expense.splitWith[0] === expense.paidBy
      );
  }

  function claraStateToClaramente(raw) {
    const canonical = normalizeCanonicalState(raw);
    const people = canonical.people.map((person) => ({
      id: person.id,
      name: person.name,
      isGuest: person.isGuest
    }));
    const selfPaid = canonical.expenses.length > 0 && canonical.expenses.every(isSelfContribution);
    if (selfPaid) {
      return {
        people,
        items: canonical.expenses.map((expense) => ({
          id: expense.id,
          type: "single",
          name: expense.description,
          amountCents: expense.amountCents,
          ownerId: expense.paidBy,
          paidById: expense.paidBy
        })),
        paidMode: "none",
        paymentMethod: "",
        cardPayerId: "",
        paidById: ""
      };
    }
    const payers = Array.from(new Set(canonical.expenses.map((expense) => expense.paidBy)));
    const paidMode = payers.length > 1 ? "multiple" : (canonical.expenses.length ? "single" : "");
    return {
      people,
      items: canonical.expenses.map((expense) => {
        if (expense.splitWith.length === 1) {
          return {
            id: expense.id,
            type: "single",
            name: expense.description,
            amountCents: expense.amountCents,
            ownerId: expense.splitWith[0],
            paidById: expense.paidBy
          };
        }
        return {
          id: expense.id,
          type: "product",
          name: expense.description,
          amountCents: expense.amountCents,
          eatenBy: expense.splitWith.slice(),
          paidById: expense.paidBy
        };
      }),
      paidMode,
      paymentMethod: paidMode === "single" || paidMode === "multiple" ? "cash" : "",
      cardPayerId: "",
      paidById: paidMode === "single" ? payers[0] || "" : ""
    };
  }

  return {
    calculateClaramenteContributions,
    calculateClaramenteSettlements,
    calculateClaramenteCardSettlements,
    calculateSettlements,
    claramenteToClaraState,
    claraStateToClaramente,
    normalizeCanonicalState,
    normalizeClaramenteState,
    validateCanonicalState,
    validateClaramenteState,
    distribute,
    settleBalances
  };
});

