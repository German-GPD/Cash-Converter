<div align="center">

# ↔ Cash Converter

### One input. Every rate. Clear sources.

**USD · EUR · RUB · BYN · PLN · BTC · XAU · CNY**

[**Открыть конвертер / Open app**](https://german-gpd.github.io/Cash-Converter/) · [GitHub](https://github.com/German-GPD/Cash-Converter) · [German / GPD](https://german-gpd.github.io/about-german/)

</div>

---

## 🇷🇺 О проекте

Cash Converter — минималистичный конвертер валют, Bitcoin и золота с автоматической светлой/тёмной темой и интерфейсом в духе Apple: стеклянные панели, квадратная геометрия и тонкая пиксельная сетка.

### Что умеет

- Восемь активов: **USD, EUR, RUB, BYN, PLN, BTC, XAU, CNY**.
- Ввод суммы в любую строку пересчитывает остальные активы.
- Курсы из доступных источников усредняются, если источников больше одного.
- Показывает, когда есть только один источник и сверка недоступна.
- Адаптация под системную тему и размер экрана.
- Анимации появления, переключения исходной валюты и обновления данных.
- Без фреймворков, сборки и ключей API.

### Источники

- [ExchangeRate-API](https://www.exchangerate-api.com/) — основной фиатный источник.
- [Frankfurter](https://frankfurter.dev/) — независимые курсы доступных валютных пар.
- [CoinGecko](https://www.coingecko.com/) — цена Bitcoin в USD.
- [Gold-API](https://www.gold-api.com/) — цена золота в USD за тройскую унцию.

Среднее рассчитывается по доступным значениям в единой базе USD. Второй источник доступен не для всех валют; если он не возвращает данные, используется доступный курс и это отражается в интерфейсе. Курсы справочные, могут задерживаться или отличаться от банковских/биржевых цен. Золото указано за тройскую унцию. Это не финансовая рекомендация.

## 🇬🇧 About

Cash Converter is a responsive currency, Bitcoin, and gold converter with system-matched light/dark appearance and an Apple-inspired glass UI.

- Type an amount into **any asset row** to update all other rows instantly.
- Averages available independent quotes for the same asset.
- Clearly reports when only one provider is available.
- System theme support, motion details, responsive layout, no build step.

### Author

Created by **[German / GPD](https://github.com/German-GPD)**.

- 🌐 [Personal website](https://german-gpd.github.io/about-german/)
- 💻 [GitHub profile](https://github.com/German-GPD)
- ✈️ [Telegram](https://t.me/redfox_g56)

## Run locally

Open `index.html` in a modern browser with an internet connection. The interface and styles are in `index.html`; conversion logic is in `script.js`.

<div align="center">**Cash Converter · Less friction, more clarity.**</div>