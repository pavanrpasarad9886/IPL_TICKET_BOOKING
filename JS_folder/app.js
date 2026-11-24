const BOOKINGS_KEY = "ipl-ticket-bookings";
const TOAST_STORAGE_KEY = "ipl-toast-message";

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
        const matchName = link.closest("tr")?.querySelectorAll("td")[1]?.textContent?.trim();
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
  const matchSelect = form.elements.namedItem("match");
  const matchFromUrl = new URLSearchParams(window.location.search).get("match");

  if (matchFromUrl && Array.from(matchSelect.options).some(option => option.value === matchFromUrl)) {
    matchSelect.value = matchFromUrl;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const selectedMatch = matchSelect.selectedOptions[0];
    const standSelect = form.elements.namedItem("stand-category");
    const selectedStand = standSelect.selectedOptions[0];
    const quantity = Number(form.elements.namedItem("ticket-quantity").value);
    const prices = { general: 800, premium: 1800, vip: 4500 };

    try {
      const bookings = getBookings();
      const booking = {
        id: `IPL-${Date.now()}`,
        name: form.elements.namedItem("name").value.trim(),
        email: form.elements.namedItem("email").value.trim(),
        phone: form.elements.namedItem("phone").value.trim(),
        matchId: selectedMatch.value,
        match: selectedMatch.textContent.trim(),
        date: selectedMatch.dataset.date,
        venue: selectedMatch.dataset.venue,
        stand: selectedStand.textContent.trim(),
        quantity,
        total: prices[selectedStand.value] * quantity,
        preference: form.elements.namedItem("booking-preference").value,
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
setupBookingForm();
setupBookingsList();
setupSmoothBookingScroll();
showSavedToast();