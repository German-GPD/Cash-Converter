<div align="center">

# ◈ Cash Converter

### A calmer way to compare currencies.

**USD · EUR · RUB · BYN · PLN · GBP · KZT · BTC · XAU · CNY**

[**Открыть приложение / Open app**](https://german-gpd.github.io/Cash-Converter/) · [Исходный код / Source](https://github.com/German-GPD/Cash-Converter) · [German / GPD](https://german-gpd.github.io/about-german/)

*Heritage-inspired design · One amount · Ten assets*

</div>

---

## 🇷🇺 О проекте

**Cash Converter** — браузерный конвертер валют, Bitcoin и золота. Интерфейс оформлен в сдержанном стиле **OLED**: тёплые оттенки, латунные акценты, тонкие линии и спокойная типографика. Главная задача — быстро показать сумму, не перегружая экран.

### Возможности

- **11 активов:** USD, EUR, RUB, BYN, PLN, GBP, KZT, BTC, золото (XAU, за 1 грамм) и CNY.
- **Одна исходная сумма.** Выбери валюту кнопкой — все значения пересчитаются автоматически.
- **Акцент на главной части числа.** Целая часть крупная, цифры после запятой заметно меньше и светлее.
- **Графики внизу страницы** — отдельная карточка для каждого актива, текущая цена в USD и линия динамики.
- **История на устройстве.** Снимки курса сохраняются локально в браузере; график набирает историю по мере обновлений. Это не полноценный биржевой архив.
- **Темы:** автоматическая по системе, светлая и тёмная.
- Адаптация под телефон и компьютер, поддержка настройки уменьшения анимации.
- Без сборки, фреймворков и собственных API-ключей.

### Источники курсов

- [ExchangeRate-API](https://www.exchangerate-api.com/) — основной источник фиатных курсов.
- [Frankfurter](https://frankfurter.dev/) — дополнительная сверка доступных валютных пар.
- [Беларусбанк](https://belarusbank.by/ru/33139/forDevelopers/api/kursinfo) — попытка получить наличный курс USD в Орше. Браузерный запрос может блокироваться CORS или изменением формата ответа.
- [CoinGecko](https://www.coingecko.com/) — цена Bitcoin в USD.
- [Gold-API](https://www.gold-api.com/) — золото за тройскую унцию; приложение переводит цену в стоимость одного грамма.

Если доступны несколько подходящих котировок, приложение усредняет их в единой базе USD. Состав источников зависит от доступности API. Курсы справочные, могут обновляться с задержкой и отличаться от фактических банковских или биржевых цен. Это не финансовая рекомендация.

### Запуск локально

1. Скачай или клонируй репозиторий.
2. Открой `index.html` в современном браузере с подключением к интернету.
3. `index.html` содержит разметку и стили, а `script.js` — логику конвертации и графиков.

### Автор

Создано **[German / GPD](https://github.com/German-GPD)**.

- 🌐 [Личный сайт](https://german-gpd.github.io/about-german/)
- 💻 [GitHub](https://github.com/German-GPD)
- ✈️ [Telegram](https://t.me/redfox_g56)

---

## 🇬🇧 About

**Cash Converter** is a lightweight browser-based converter for fiat currencies, Bitcoin, and gold. Its restrained **OLED-inspired** visual style combines warm neutrals, antique-brass accents, fine borders, and editorial typography.

### Features

- **10 assets:** USD, EUR, RUB, BYN, PLN, GBP, KZT, BTC, gold (XAU, per gram), CNY, and Brent crude oil (per barrel).
- Enter one amount and select the source asset; all results update instantly.
- Integer digits are emphasized while fractional digits are smaller and quieter.
- Individual asset cards and mini charts are placed near the bottom of the page, including Brent crude oil per barrel.
- Rate snapshots are stored locally in the browser. Charts build their history over time; they are **not** a full market-history feed.
- Automatic system theme, light theme, and dark theme.
- Responsive layout and reduced-motion support.
- No build tools, framework, or private API key required.

### Rate providers

- [ExchangeRate-API](https://www.exchangerate-api.com/) — primary fiat feed.
- [Frankfurter](https://frankfurter.dev/) — additional checks for supported currency pairs.
- [Belarusbank](https://belarusbank.by/ru/33139/forDevelopers/api/kursinfo) — optional Orsha cash USD quote; browser access may be blocked by CORS or response changes.
- [CoinGecko](https://www.coingecko.com/) — Bitcoin/USD.
- [Gold-API](https://www.gold-api.com/) — gold per troy ounce, converted to a per-gram price.

Available quotes may be averaged when multiple sources are present. Rates are indicative and can be delayed or differ from actual bank or exchange prices. This project does not provide financial advice.

### Run locally

Download or clone the repository and open `index.html` in a modern browser with internet access. The HTML and CSS live in `index.html`; conversion and chart logic live in `script.js`.

### Author

Created by **[German / GPD](https://github.com/German-GPD)**.

- 🌐 [Personal website](https://german-gpd.github.io/about-german/)
- 💻 [GitHub profile](https://github.com/German-GPD)
- ✈️ [Telegram](https://t.me/redfox_g56)

---

## 🇪🇸 Sobre el proyecto

**Cash Converter** es un conversor web ligero de monedas, Bitcoin, oro y petróleo. Su diseño **OLED** utiliza un fondo negro real, paneles oscuros y acentos verdes discretos para pantallas OLED y AMOLED.

### Características

- **11 activos:** USD, EUR, RUB, BYN, PLN, GBP, KZT, BTC, oro (XAU, por gramo), CNY y petróleo Brent (por barril).
- Introduce una sola cantidad y selecciona la moneda de origen; todos los resultados se actualizan automáticamente.
- La parte entera destaca y los decimales son más pequeños y discretos.
- Gráficos individuales al final de la página. Las líneas muestran capturas guardadas en el navegador y el historial se acumula al actualizar las cotizaciones.
- Temas automático, claro y oscuro OLED.
- Diseño adaptable a móviles y ordenadores, con soporte para reducir las animaciones.

### Fuentes de datos

- [ExchangeRate-API](https://www.exchangerate-api.com/) y [Frankfurter](https://frankfurter.dev/) — tipos de cambio.
- [CoinGecko](https://www.coingecko.com/) — Bitcoin.
- [Gold-API](https://www.gold-api.com/) — oro.
- [Croncopia](https://croncopia.com/) — precio indicativo del petróleo Brent por barril.
- [Belarusbank](https://belarusbank.by/) — intento opcional de obtener la cotización en Orsha; puede fallar por restricciones CORS.

Las cotizaciones son orientativas, pueden tener retrasos y no constituyen asesoramiento financiero.

### Autor

Creado por **[German / GPD](https://github.com/German-GPD)**.

- 🌐 [Sitio personal](https://german-gpd.github.io/about-german/)
- 💻 [GitHub](https://github.com/German-GPD)
- ✈️ [Telegram](https://t.me/redfox_g56)

---

## License

This project is licensed under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**. You may share and adapt the work for non-commercial purposes with appropriate credit, a link to the license, and an indication of changes. Commercial use is not permitted under this license.

Read the full legal code: https://creativecommons.org/licenses/by-nc/4.0/

<div align="center">**Cash Converter · Less friction, more clarity.**</div>
