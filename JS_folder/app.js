const BOOKINGS_KEY = "ipl-ticket-bookings";
const TOAST_STORAGE_KEY = "ipl-toast-message";
const TICKET_PRICES = { general: 800, premium: 1800, vip: 4500 };

function showToast(message, type = "success") {
  let container = document.querySelector("#toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Notifications");
    document.body.append(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;
  container.append(toast);

  window.setTimeout(() => {
    toast.classList.add("toast-hiding");
    window.setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showSavedToast() {
  try {
    const savedToast = sessionStorage.getItem(TOAST_STORAGE_KEY);
    if (!savedToast) return;

    sessionStorage.removeItem(TOAST_STORAGE_KEY);
    showToast(savedToast);
  } catch (error) {
    console.error("Unable to load the saved notification.", error);
  }
}

function setupMatchLinks() {
  document.querySelectorAll("a[data-book-match]").forEach(link => {
    link.href = `booking.html?match=${encodeURIComponent(link.dataset.bookMatch)}#book-ticket`;

    link.addEventListener("click", () => {
      try {
        const matchName = link.closest(".match-card")?.querySelector("h3")?.textContent?.trim();
        sessionStorage.setItem(
          TOAST_STORAGE_KEY,
          matchName ? `${matchName} selected.` : "Match selected."
        );
      } catch (error) {
        console.error("Unable to save the match notification.", error);
      }
    });
  });
}

function setupMobileMenu() {
  const toggle = document.querySelector("#nav-toggle");
  const navigation = document.querySelector("#main-navigation");
  if (!toggle || !navigation) return;

  function closeMenu() {
    navigation.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    navigation.classList.toggle("is-open", !isExpanded);
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    toggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  });

  navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
}

function setupMatchViews() {
  const grid = document.querySelector("#match-grid");
  if (!grid) return;

  const teamFilter = document.querySelector("#team-filter");
  const matchCount = document.querySelector("#match-count");
  const emptyMessage = document.querySelector("#match-empty");
  const cards = Array.from(grid.querySelectorAll(".match-card"));
  const viewButtons = document.querySelectorAll("[data-match-view]");

  function filterMatches() {
    const selectedTeam = teamFilter.value;
    let visibleCount = 0;

    cards.forEach(card => {
      const teams = card.dataset.teams.split(/\s+/);
      const isVisible = selectedTeam === "all" || teams.includes(selectedTeam);
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    matchCount.textContent = `${visibleCount} match${visibleCount === 1 ? "" : "es"} shown.`;
    emptyMessage.hidden = visibleCount > 0;
  }

  teamFilter.addEventListener("change", filterMatches);
  viewButtons.forEach(button => {
    button.addEventListener("click", () => {
      const view = button.dataset.matchView;
      grid.dataset.view = view;
      viewButtons.forEach(viewButton => {
        viewButton.setAttribute("aria-pressed", String(viewButton === button));
      });
    });
  });

  filterMatches();
}

function setupSmoothBookingScroll() {
  const bookingForm = document.querySelector("#book-ticket");
  if (!bookingForm) return;

  window.requestAnimationFrame(() => {
    bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function getBookings() {
  const savedBookings = localStorage.getItem(BOOKINGS_KEY);
  if (!savedBookings) return [];

  const bookings = JSON.parse(savedBookings);
  if (!Array.isArray(bookings)) {
    throw new Error("Saved booking data is invalid.");
  }
  return bookings;
}

function showStatus(element, message) {
  if (element) element.textContent = message;
}

function setupBookingForm() {
  const form = document.querySelector("#book-ticket form");
  if (!form) return;

  const status = document.querySelector("#booking-status");
  const matchSelect = form.querySelector("#booking-match");
  const standSelect = form.querySelector("#stand-category");
  const quantityInput = form.querySelector("#ticket-quantity");
  const nameInput = form.querySelector("#customer-name");
  const emailInput = form.querySelector("#customer-email");
  const phoneInput = form.querySelector("#customer-phone");
  const summaryMatch = document.querySelector("#summary-match");
  const summaryDate = document.querySelector("#summary-date");
  const summaryVenue = document.querySelector("#summary-venue");
  const summaryStand = document.querySelector("#summary-stand");
  const summaryQuantity = document.querySelector("#summary-quantity");
  const summaryUnitPrice = document.querySelector("#summary-unit-price");
  const summaryTotal = document.querySelector("#summary-total");
  const summaryMessage = document.querySelector("#summary-message");
  const matchFromUrl = new URLSearchParams(window.location.search).get("match");

  if (matchFromUrl && Array.from(matchSelect.options).some(option => option.value === matchFromUrl)) {
    matchSelect.value = matchFromUrl;
  }

  const readSelection = () => ({
    match: matchSelect.selectedOptions[0],
    stand: standSelect.selectedOptions[0],
    quantity: Number(quantityInput.value),
  });
  let selection = readSelection();
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const updateSummary = (notify = false) => {
    selection = readSelection();

    const { match, stand, quantity } = selection;
    const hasMatch = Boolean(match.value);
    const hasStand = Boolean(stand.value);
    const hasValidQuantity = quantityInput.value !== "" && quantityInput.validity.valid;
    const hasCompleteSelection = hasMatch && hasStand && hasValidQuantity;

    summaryMatch.textContent = hasMatch ? match.textContent.trim() : "Not selected";
    summaryDate.textContent = hasMatch ? match.dataset.date : "—";
    summaryVenue.textContent = hasMatch ? match.dataset.venue : "—";
    summaryStand.textContent = hasStand ? stand.textContent.trim() : "Not selected";
    summaryQuantity.textContent = hasValidQuantity ? String(quantity) : "—";
    summaryUnitPrice.textContent = hasStand ? currency.format(TICKET_PRICES[stand.value]) : "—";
    summaryTotal.textContent = hasCompleteSelection
      ? currency.format(TICKET_PRICES[stand.value] * quantity)
      : "—";
    summaryMessage.textContent = hasCompleteSelection
      ? "Your total reflects the selected stand and ticket quantity."
      : "Choose a match and stand, then enter a quantity from 1 to 10.";

    if (notify) showToast("Booking summary updated.");
  };

  [matchSelect, standSelect, quantityInput].forEach(control => {
    control.addEventListener("change", () => updateSummary(true));
  });
  quantityInput.addEventListener("input", () => updateSummary());
  form.addEventListener("reset", () => window.setTimeout(() => updateSummary(), 0));
  updateSummary();

  form.addEventListener("submit", event => {
    event.preventDefault();

    const { match: selectedMatch, stand: selectedStand, quantity } = selection;
    const preferenceInput = form.querySelector('[name="booking-preference"]:checked');

    try {
      const bookings = getBookings();
      const booking = {
        id: `IPL-${Date.now()}`,
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        matchId: selectedMatch.value,
        match: selectedMatch.textContent.trim(),
        date: selectedMatch.dataset.date,
        venue: selectedMatch.dataset.venue,
        stand: selectedStand.textContent.trim(),
        quantity,
        total: TICKET_PRICES[selectedStand.value] * quantity,
        preference: preferenceInput.value,
        status: "Confirmed",
      };

      bookings.push(booking);
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
      try {
        sessionStorage.setItem(TOAST_STORAGE_KEY, "Booking confirmed successfully.");
      } catch (error) {
        console.error("Unable to save the booking notification.", error);
      }
      window.location.href = "index.html#my-bookings";
    } catch (error) {
      console.error("Unable to save the booking.", error);
      showStatus(status, "Your booking could not be saved. Please try again.");
      showToast("Your booking could not be saved.", "error");
    }
  });
}

function setupBookingsList() {
  const records = document.querySelector("#booking-records");
  if (!records) return;

  const status = document.querySelector("#bookings-status");
  const clearButton = document.querySelector("#clear-bookings");

  function renderBookings() {
    records.replaceChildren();

    try {
      const bookings = getBookings();
      if (bookings.length === 0) {
        showStatus(status, "No bookings yet.");
        clearButton.disabled = true;
        return;
      }

      const currency = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });

      bookings.forEach(booking => {
        const row = document.createElement("tr");
        [
          booking.id,
          booking.match,
          booking.date,
          booking.venue,
          booking.stand,
          String(booking.quantity),
          currency.format(booking.total),
          booking.status,
        ].forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.append(cell);
        });
        records.append(row);
      });

      showStatus(status, `${bookings.length} booking${bookings.length === 1 ? "" : "s"} found.`);
      clearButton.disabled = false;
    } catch (error) {
      console.error("Unable to load saved bookings.", error);
      showStatus(status, "Saved bookings could not be loaded.");
      clearButton.disabled = true;
    }
  }

  clearButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(BOOKINGS_KEY);
      renderBookings();
      showToast("All bookings have been cleared.");
    } catch (error) {
      console.error("Unable to clear saved bookings.", error);
      showStatus(status, "Bookings could not be cleared. Please try again.");
      showToast("Bookings could not be cleared.", "error");
    }
  });

  renderBookings();
}

setupMatchLinks();
setupMobileMenu();
setupMatchViews();
setupBookingForm();
setupBookingsList();
setupSmoothBookingScroll();
showSavedToast();