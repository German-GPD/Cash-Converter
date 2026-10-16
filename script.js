const API_URL = "https://open.er-api.com/v6/latest/";
const $ = (selector) => document.querySelector(selector);
const amountInput = $("#amount");
const fromSelect = $("#fromCurrency");
const toSelect = $("#toCurrency");
const resultOutput = $("#result");
const statusEl = $("#status");
const refreshButton = $("#refreshButton");
const swapButton = $("#swapButton");
const copyButton = $("#copyButton");
const rateText = $("#rateText");
const rateDate = $("#rateDate");
const currencyNames = new Intl.DisplayNames(["ru"], { type: "currency" });
const flagOverrides = { EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳", CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", RUB: "🇷🇺", BYN: "🇧🇾", PLN: "🇵🇱", UAH: "🇺🇦", TRY: "🇹🇷", INR: "🇮🇳", KRW: "🇰🇷", BRL: "🇧🇷", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰", CZK: "🇨🇿", SGD: "🇸🇬", HKD: "🇭🇰", MXN: "🇲🇽", ZAR: "🇿🇦", AED: "🇦🇪", THB: "🇹🇭", IDR: "🇮🇩", ILS: "🇮🇱", SAR: "🇸🇦" };
let ratesCache = new Map();
let currentRates = null;
let currentBase = "";
let lastUpdated = "";
let requestController = null;
let refreshInProgress = false;
const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 });
const moneyFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

function currencyName(code) {
  try { return currencyNames.of(code) || code; } catch { return code; }
}
function flagFor(code) { return flagOverrides[code] || "💱"; }
function fillSelect(select, codes) {
  const previous = select.value;
  const fragment = document.createDocumentFragment();
  [...codes].sort().forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code;
    fragment.appendChild(option);
  });
  select.replaceChildren(fragment);
  select.value = codes.includes(previous) ? previous : (codes.includes(select === fromSelect ? "USD" : "EUR") ? (select === fromSelect ? "USD" : "EUR") : codes[0]);
}
function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? " " + type : "");
}
function setBusy(busy) {
  refreshInProgress = busy;
  refreshButton.disabled = busy;
  refreshButton.style.opacity = busy ? ".55" : "1";
  document.body.classList.toggle("loading", busy);
}
async function loadRates(base, force = false) {
  const cached = ratesCache.get(base);
  if (!force && cached && Date.now() - cached.savedAt < 5 * 60 * 1000) {
    currentRates = cached.data.rates;
    currentBase = base;
    lastUpdated = cached.data.time_last_update_utc || "";
    return cached.data;
  }
  if (requestController) requestController.abort();
  requestController = new AbortController();
  const response = await fetch(API_URL + encodeURIComponent(base), { signal: requestController.signal, cache: "no-store" });
  if (!response.ok) throw new Error("Сервис курсов ответил ошибкой (" + response.status + ").");
  const data = await response.json();
  if (data.result !== "success" || !data.rates || typeof data.rates !== "object") {
    throw new Error("Сервис не вернул курсы для этой валюты.");
  }
  ratesCache.set(base, { data, savedAt: Date.now() });
  currentRates = data.rates;
  currentBase = base;
  lastUpdated = data.time_last_update_utc || "";
  return data;
}
function formatDate(value) {
  if (!value) return "дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
function updateCurrencyMeta() {
  $("#fromName").textContent = currencyName(fromSelect.value);
  $("#toName").textContent = currencyName(toSelect.value);
  $("#fromFlag").textContent = flagFor(fromSelect.value);
  $("#toFlag").textContent = flagFor(toSelect.value);
  $("#liveLabel").textContent = "Курсы валют онлайн";
}
function renderConversion() {
  updateCurrencyMeta();
  const amount = Number(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;
  if (amountInput.value.trim() === "" || !Number.isFinite(amount) || amount < 0) {
    resultOutput.textContent = "Введите сумму";
    rateText.textContent = "—";
    return;
  }
  if (!currentRates || currentBase !== from || typeof currentRates[to] !== "number") {
    resultOutput.textContent = "…";
    rateText.textContent = "Загружаем курс…";
    return;
  }
  const rate = currentRates[to];
  const converted = amount * rate;
  resultOutput.textContent = moneyFormat.format(converted);
  rateText.textContent = "1 " + from + " = " + numberFormat.format(rate) + " " + to;
  rateDate.textContent = formatDate(lastUpdated);
}
async function refreshRates(force = false) {
  if (refreshInProgress) return;
  setBusy(true);
  setStatus("Получаем актуальные курсы…");
  try {
    const data = await loadRates(fromSelect.value, force);
    const codes = Object.keys(data.rates).filter((code) => /^[A-Z]{3}$/.test(code)).sort();
    const oldFrom = fromSelect.value;
    const oldTo = toSelect.value;
    fillSelect(fromSelect, codes);
    fillSelect(toSelect, codes);
    fromSelect.value = codes.includes(oldFrom) ? oldFrom : "USD";
    toSelect.value = codes.includes(oldTo) ? oldTo : "EUR";
    currentRates = data.rates;
    currentBase = fromSelect.value;
    lastUpdated = data.time_last_update_utc || "";
    // The first response is based on the selected source currency.
    if (currentBase !== fromSelect.value) await loadRates(fromSelect.value, false);
    renderConversion();
    setStatus("Курсы успешно загружены. Значения справочные, не банковская котировка.", "success");
  } catch (error) {
    if (error.name === "AbortError") return;
    resultOutput.textContent = "—";
    rateText.textContent = "Курс временно недоступен";
    setStatus((error.message || "Не удалось загрузить курсы.") + " Проверь интернет и попробуй ещё раз.", "error");
  } finally {
    setBusy(false);
  }
}
async function ensureBaseAndRender(force = false) {
  renderConversion();
  if (currentBase === fromSelect.value && currentRates && typeof currentRates[toSelect.value] === "number") return;
  try {
    setStatus("Обновляем курс для " + fromSelect.value + "…");
    await loadRates(fromSelect.value, force);
    renderConversion();
    setStatus("Курсы обновлены. Значения справочные, не банковская котировка.", "success");
  } catch (error) {
    if (error.name !== "AbortError") setStatus("Не удалось загрузить курс. Проверь подключение и повтори попытку.", "error");
  }
}
amountInput.addEventListener("input", renderConversion);
fromSelect.addEventListener("change", () => { updateCurrencyMeta(); ensureBaseAndRender(); });
toSelect.addEventListener("change", renderConversion);
swapButton.addEventListener("click", async () => {
  const oldFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = oldFrom;
  updateCurrencyMeta();
  await ensureBaseAndRender();
});
refreshButton.addEventListener("click", () => refreshRates(true));
document.querySelectorAll("[data-amount]").forEach((button) => {
  button.addEventListener("click", () => {
    amountInput.value = button.dataset.amount;
    document.querySelectorAll("[data-amount]").forEach((item) => item.classList.toggle("active", item === button));
    renderConversion();
  });
});
copyButton.addEventListener("click", async () => {
  const amount = Number(amountInput.value);
  if (!Number.isFinite(amount) || amount < 0 || !currentRates || currentBase !== fromSelect.value) {
    setStatus("Сначала дождись загрузки курса и введи сумму.", "error");
    return;
  }
  const converted = amount * currentRates[toSelect.value];
  const text = moneyFormat.format(converted) + " " + toSelect.value;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.innerHTML = "✓ <span>Скопировано</span>";
    setStatus("Результат скопирован: " + text, "success");
    window.setTimeout(() => { copyButton.innerHTML = "▢ <span>Копировать</span>"; }, 1600);
  } catch {
    setStatus("Копирование недоступно в этом браузере. Результат: " + text, "error");
  }
});
refreshRates(false);