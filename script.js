(() => {
  const config = window.SERVICE_CENTER_CONFIG;
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const icons = {
    phone: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="13" y="4" width="22" height="40" rx="5"/><path d="M20 9h8M21 38h6"/><path d="m19 24 3 3 7-8"/></svg>',
    laptop: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="7" width="32" height="25" rx="3"/><path d="M4 37h40l-4 5H8l-4-5Z"/><path d="m19 20 4 4 7-8"/></svg>',
    home: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m5 22 19-16 19 16"/><path d="M10 20v22h28V20M19 42V28h10v14"/><path d="m20 17 4 4 7-8"/></svg>',
    spark: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 4.4 14.6L43 24l-14.6 4.4L24 43l-4.4-14.6L5 24l14.6-5.4L24 4Z"/><path d="m37 5 1.5 5.5L44 12l-5.5 1.5L37 19l-1.5-5.5L30 12l5.5-1.5L37 5Z"/></svg>'
  };

  const normalizeWhatsApp = (value) => String(value || "").replace(/\D/g, "");
  const formatPhone = (digits) => digits.startsWith("7") && digits.length === 11 ? `+${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}` : `+${digits}`;
  const whatsappNumber = normalizeWhatsApp(config.whatsappNumber);
  const hasWhatsAppNumber = whatsappNumber.length >= 8 && whatsappNumber.length <= 15;
  const demoMode = config.DEMO_MODE !== false;
  document.querySelectorAll("[data-company-name]").forEach((node) => { node.textContent = config.companyName; });
  document.querySelectorAll("[data-city]").forEach((node) => { node.textContent = config.city; });
  document.querySelectorAll("[data-address]").forEach((node) => { node.textContent = config.address; });
  document.querySelectorAll("[data-phone]").forEach((node) => {
    node.textContent = !demoMode && hasWhatsAppNumber ? formatPhone(whatsappNumber) : "WhatsApp подключается под заказчика";
  });
  const contactLabel = $("[data-contact-label]");
  const contactNote = $("[data-contact-note]");
  if (!demoMode && hasWhatsAppNumber) {
    if (contactLabel) contactLabel.textContent = "Бизнес-контакт";
    if (contactNote) contactNote.textContent = "Нажмите, чтобы открыть WhatsApp с подготовленным сообщением.";
  }

  const defaultText = `Здравствуйте! Хочу уточнить по ремонту техники в ${config.companyName}.`;
  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    link.href = !demoMode && hasWhatsAppNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultText)}`
      : "#whatsapp-preview";
  });

  const dialog = $("#wa-dialog");
  const dialogTitle = $("#wa-dialog-title");
  const dialogDescription = $("#wa-dialog-description");
  const dialogMessage = $("#wa-dialog-message");
  const showPreview = (message, missingNumber = false) => {
    if (!dialog) return;
    dialogTitle.textContent = missingNumber ? "Добавьте контакт заказчика" : "Предпросмотр сообщения";
    dialogDescription.textContent = missingNumber
      ? "Для обычного режима укажите проверенный номер WhatsApp в config.js. Сейчас ссылка не откроется."
      : "В деморежиме сайт не открывает WhatsApp и не отправляет сообщения. Реальный контакт подключается под конкретного заказчика.";
    dialogMessage.textContent = message || "Здесь появится текст сообщения.";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };
  const closePreview = () => {
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    else dialog?.removeAttribute("open");
  };
  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!demoMode && hasWhatsAppNumber) return;
      event.preventDefault();
      showPreview(defaultText, !demoMode && !hasWhatsAppNumber);
    });
  });
  $("#wa-dialog-close")?.addEventListener("click", closePreview);
  $("#wa-dialog-ok")?.addEventListener("click", closePreview);
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) closePreview(); });

  const serviceGrid = $("#services-grid");
  const serviceSelect = $("#service");
  config.services.forEach((service, index) => {
    const safeTitle = escapeHtml(service.title);
    serviceGrid.insertAdjacentHTML("beforeend", `<article class="service-card"><div class="service-card-top"><span class="service-icon">${icons[service.icon] || icons.spark}</span><span class="service-index">0${index + 1}</span></div><h3>${safeTitle}</h3><p>${escapeHtml(service.description)}</p><div class="service-examples">${escapeHtml(service.examples)}</div></article>`);
    serviceSelect.insertAdjacentHTML("beforeend", `<option value="${safeTitle}">${safeTitle}</option>`);
  });

  const form = $("#request-form");
  const hint = $("#form-hint");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const service = $("#service").value.trim();
    const problem = $("#problem").value.trim();
    const name = $("#client-name").value.trim();
    const lines = ["Здравствуйте! Хочу уточнить по ремонту техники.", `Тип устройства: ${service}`, `Проблема: ${problem}`];
    if (name) lines.push(`Меня зовут: ${name}`);
    lines.push(`Обращаюсь в ${config.companyName}, ${config.city}.`);
    const message = lines.join("\n");
    if (demoMode) {
      hint.textContent = "Предпросмотр ниже по кнопке: данные останутся только в этой вкладке и не будут отправлены.";
      showPreview(message);
      return;
    }
    if (!hasWhatsAppNumber) {
      hint.textContent = "Сначала укажите проверенный WhatsApp-номер заказчика в config.js.";
      showPreview(message, true);
      return;
    }
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    hint.textContent = "Открылось новое окно WhatsApp с заполненным сообщением. Проверьте данные и отправьте его вручную.";
    window.open(url, "_blank", "noopener,noreferrer");
  });

  const menuButton = $(".menu-toggle");
  const mobileNav = $(".mobile-nav");
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    mobileNav.classList.toggle("is-open", !open);
  });
  mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
  }));
  $("#year").textContent = new Date().getFullYear();
})();
