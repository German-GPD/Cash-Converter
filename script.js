const API = {
  fiat: "https://open.er-api.com/v6/latest/USD",
  cross: code => "https://api.frankfurter.dev/v2/rate/usd/" + code.toLowerCase(),
  bitcoin: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  gold: "https://api.gold-api.com/price/XAU"
};
const ASSETS = {
  USD:{name:"Доллар США",icon:"🇺🇸",kind:"fiat",digits:2},
  EUR:{name:"Евро",icon:"🇪🇺",kind:"fiat",digits:2},
  RUB:{name:"Российский рубль",icon:"🇷🇺",kind:"fiat",digits:2},
  BYN:{name:"Белорусский рубль",icon:"🇧🇾",kind:"fiat",digits:2},
  PLN:{name:"Польский злотый",icon:"🇵🇱",kind:"fiat",digits:2},
  BTC:{name:"Bitcoin",icon:"₿",kind:"crypto",digits:8},
  XAU:{name:"Золото · тройская унция",icon:"🟡",kind:"metal",digits:4},
  CNY:{name:"Китайский юань",icon:"🇨🇳",kind:"fiat",digits:2}
};
const $ = s => document.querySelector(s);
const amountInput=$("#amount"), fromSelect=$("#fromCurrency"), toSelect=$("#toCurrency"), resultOutput=$("#result");
const statusEl=$("#status"), refreshButton=$("#refreshButton"), swapButton=$("#swapButton"), copyButton=$("#copyButton");
const rateText=$("#rateText"), rateMeta=$("#rateMeta"), checkBadge=$("#checkBadge");
const numberFormat = new Intl.NumberFormat("ru-RU",{maximumFractionDigits:8});
let unitsPerUSD = {USD:1};
let sources = {primary:false, cross:{}, btc:false, gold:false};
let lastUpdated = null, isLoading = false, requestId = 0, lastResult = null;
const fiatCache = new Map();

function setStatus(message,type=""){statusEl.textContent=message;statusEl.className="status"+(type?" "+type:"");}
function fmt(value,digits=2){if(!Number.isFinite(value))return "—";return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:digits,minimumFractionDigits:0}).format(value);}
function money(value,code){const digits=ASSETS[code]?.digits??2;return fmt(value,digits)+" "+code;}
function parseAmount(){const raw=amountInput.value.trim().replace(/\s/g,"").replace(",",".");if(!raw)return null;const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;}
function fillAssetSelect(select,initial){select.replaceChildren(...Object.keys(ASSETS).map(code=>{const o=document.createElement("option");o.value=code;o.textContent=code;return o;}));select.value=initial;}
function updateAssetLabels(){
  const from=fromSelect.value,to=toSelect.value;
  $("#fromName").textContent=ASSETS[from].name;$("#toName").textContent=ASSETS[to].name;
  $("#fromIcon").textContent=ASSETS[from].icon;$("#toIcon").textContent=ASSETS[to].icon;
  document.querySelectorAll("[data-amount]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.amount)===Number(amountInput.value)));
}
async function fetchJSON(url,timeout=9000){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetch(url,{signal:controller.signal,cache:"no-store"});if(!response.ok)throw new Error("HTTP "+response.status);return await response.json();}
  finally{clearTimeout(timer);}
}
async function fetchFiat(){
  const data=await fetchJSON(API.fiat);
  if(data.result!=="success"||!data.rates||typeof data.rates.USD!=="number")throw new Error("Основной источник валют недоступен");
  const rates={USD:1};for(const code of ["EUR","RUB","BYN","PLN","CNY"]){const r=data.rates[code];if(Number.isFinite(r)&&r>0)rates[code]=r;}
  fiatCache.clear();Object.entries(rates).forEach(([code,rate])=>fiatCache.set(code,rate));
  return {rates,updated:data.time_last_update_utc||null};
}
async function fetchCrossChecks(){
  const codes=["EUR","PLN","CNY"];
  const results=await Promise.allSettled(codes.map(async code=>{
    const data=await fetchJSON(API.cross(code),6500);
    const rate=Number(data.rate);
    if(!Number.isFinite(rate)||rate<=0)throw new Error("invalid rate");
    return {code,rate,date:data.date||null};
  }));
  const cross={};results.forEach((r,i)=>{if(r.status==="fulfilled")cross[r.value.code]=r.value;});
  return cross;
}
async function fetchMarket(){
  const results=await Promise.allSettled([
    fetchJSON(API.bitcoin,8500).then(d=>{const price=Number(d?.bitcoin?.usd);if(!Number.isFinite(price)||price<=0)throw new Error("BTC unavailable");return price;}),
    fetchJSON(API.gold,8500).then(d=>{const price=Number(d?.price);if(!Number.isFinite(price)||price<=0)throw new Error("gold unavailable");return price;})
  ]);
  return {btc:results[0].status==="fulfilled"?results[0].value:null,gold:results[1].status==="fulfilled"?results[1].value:null};
}
function computeUnits(fiat,market){
  const units={...fiat.rates};
  if(market.btc)units.BTC=1/market.btc;
  if(market.gold)units.XAU=1/market.gold;
  units.USD=1;return units;
}
function checkSourceHealth(){
  const liveCount=Number(sources.primary)+Number(sources.btc)+Number(sources.gold);
  $("#liveDot").className=liveCount>=2?"good":liveCount===0?"bad":"";
  $("#liveLabel").textContent=liveCount===3?"Источники доступны":liveCount?"Часть источников доступна":"Нет соединения";
  $("#primaryStatus").textContent=sources.primary?"Подключён · фиатные курсы":"Нет данных · фиатные курсы";
  $("#secondaryStatus").textContent=Object.keys(sources.cross).length?"Сверка доступна: "+Object.keys(sources.cross).join(", "):"Независимый источник временно недоступен";
  $("#marketStatus").textContent=[sources.btc?"BTC OK":"BTC недоступен",sources.gold?"золото OK":"золото недоступно"].join(" · ");
}
function render(){
  updateAssetLabels();
  const amount=parseAmount(),from=fromSelect.value,to=toSelect.value;
  if(amount===null){resultOutput.textContent="Введите сумму";rateText.textContent="—";lastResult=null;return;}
  if(!unitsPerUSD[from]||!unitsPerUSD[to]){resultOutput.textContent="Нет данных";rateText.textContent="Курс недоступен";lastResult=null;return;}
  const rate=unitsPerUSD[to]/unitsPerUSD[from],converted=amount*rate;
  resultOutput.textContent=fmt(converted,ASSETS[to].digits);
  rateText.textContent="1 "+from+" = "+fmt(rate,Math.min(8,ASSETS[to].digits+2))+" "+to;
  const crossFrom=sources.cross[from],crossTo=sources.cross[to];
  let delta=null;
  if(from==="USD"&&crossTo&&unitsPerUSD[to])delta=Math.abs(unitsPerUSD[to]-crossTo.rate)/crossTo.rate*100;
  else if(to==="USD"&&crossFrom&&unitsPerUSD[from])delta=Math.abs(unitsPerUSD[from]-crossFrom.rate)/crossFrom.rate*100;
  else if(crossFrom&&crossTo){
    const primary=unitsPerUSD[to]/unitsPerUSD[from],secondary=crossTo.rate/crossFrom.rate;
    delta=Math.abs(primary-secondary)/secondary*100;
  }
  if(delta!==null){
    checkBadge.className="rate-check "+(delta<2?"good":"bad");
    checkBadge.querySelector("span").textContent=delta<2?"Сверено":"Есть разница";
    rateMeta.textContent="Разница источников: "+fmt(delta,2)+"%";
  }else{
    checkBadge.className="rate-check";
    checkBadge.querySelector("span").textContent="Справочно";
    rateMeta.textContent=lastUpdated?"Основной курс обновлён: "+new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC"}).format(new Date(lastUpdated))+" UTC":"Второй источник для этой пары недоступен";
  }
  lastResult={amount,from,to,converted,rate};
}
async function refreshAll(){
  if(isLoading)return;isLoading=true;const myRequest=++requestId;
  refreshButton.disabled=true;setStatus("Проверяем основной и независимые источники…");
  try{
    const [fiatResult,crossResult,marketResult]=await Promise.allSettled([fetchFiat(),fetchCrossChecks(),fetchMarket()]);
    if(myRequest!==requestId)return;
    if(fiatResult.status==="fulfilled"){
      sources.primary=true;const fiat=fiatResult.value;lastUpdated=fiat.updated;
      const market=marketResult.status==="fulfilled"?marketResult.value:{btc:null,gold:null};
      sources.btc=Boolean(market.btc);sources.gold=Boolean(market.gold);
      sources.cross=crossResult.status==="fulfilled"?crossResult.value:{};
      unitsPerUSD=computeUnits(fiat,market);
      setStatus("Курсы загружены. Сверка выполняется для валют, поддерживаемых обоими источниками.","success");
    }else{
      sources.primary=false;
      if(!Object.keys(unitsPerUSD).some(code=>code!=="USD"))unitsPerUSD={USD:1};
      setStatus("Не удалось получить основной курс. Попробуй обновить позже.","error");
    }
    if(crossResult.status==="rejected")sources.cross={};
    if(marketResult.status==="rejected"){sources.btc=false;sources.gold=false;}
    checkSourceHealth();render();
  }catch(error){setStatus("Ошибка загрузки данных. Проверь подключение и попробуй снова.","error");}
  finally{isLoading=false;refreshButton.disabled=false;}
}
amountInput.addEventListener("input",render);
fromSelect.addEventListener("change",render);
toSelect.addEventListener("change",render);
swapButton.addEventListener("click",()=>{const from=fromSelect.value;fromSelect.value=toSelect.value;toSelect.value=from;render();});
refreshButton.addEventListener("click",refreshAll);
document.querySelectorAll("[data-amount]").forEach(button=>button.addEventListener("click",()=>{amountInput.value=button.dataset.amount;render();}));
copyButton.addEventListener("click",async()=>{
  if(!lastResult){setStatus("Нет результата для копирования.","error");return;}
  const text=money(lastResult.converted,lastResult.to);
  try{await navigator.clipboard.writeText(text);copyButton.querySelector("span").textContent="Скопировано";setStatus("Результат скопирован: "+text,"success");setTimeout(()=>{copyButton.querySelector("span").textContent="Копировать";},1400);}
  catch{setStatus("Не удалось открыть буфер обмена. Результат: "+text,"error");}
});
$("#sourcesToggle").addEventListener("click",()=>{const panel=$("#sourcesPanel"),button=$("#sourcesToggle"),open=button.getAttribute("aria-expanded")!=="true";button.setAttribute("aria-expanded",String(open));panel.hidden=!open;$("#sourcesChevron").textContent=open?"−":"＋";});
$("#year").textContent=new Date().getFullYear();
fillAssetSelect(fromSelect,"USD");fillAssetSelect(toSelect,"EUR");render();refreshAll();