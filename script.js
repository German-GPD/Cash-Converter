"use strict";
const ASSETS=[
 {code:"USD",name:"Доллар США",icon:"🇺🇸",kind:"fiat",digits:2},
 {code:"EUR",name:"Евро",icon:"🇪🇺",kind:"fiat",digits:2},
 {code:"RUB",name:"Российский рубль",icon:"🇷🇺",kind:"fiat",digits:2},
 {code:"BYN",name:"Белорусский рубль",icon:"🇧🇾",kind:"fiat",digits:2},
 {code:"PLN",name:"Польский злотый",icon:"🇵🇱",kind:"fiat",digits:2},
 {code:"GBP",name:"Британский фунт",icon:"🇬🇧",kind:"fiat",digits:2},
 {code:"KZT",name:"Казахстанский тенге",icon:"₸",kind:"fiat",digits:2},
 {code:"BTC",name:"Bitcoin",icon:"₿",kind:"crypto",digits:8},
 {code:"XAU",name:"Золото · 1 грамм",icon:"✳",kind:"metal",digits:4},
 {code:"CNY",name:"Китайский юань",icon:"🇨🇳",kind:"fiat",digits:2}
];
const $=id=>document.getElementById(id);
const API={
 primary:"https://open.er-api.com/v6/latest/USD",
 belarusbank:"https://belarusbank.by/api/kursExchange",
 secondary:code=>"https://api.frankfurter.dev/v2/rate/USD/"+code,
 bitcoin:"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
 gold:"https://api.gold-api.com/price/XAU"
};
let rates={USD:{value:1,sources:[{name:"USD base",value:1}]}},sourceState={primary:false,secondary:{},btc:false,gold:false,belarusbank:false},lastUpdated=null,activeCode="USD",loading=false,toastTimer=null,refreshId=0;
const HISTORY_KEY="gpd-cash-history-v1";
const CHART_COLORS={USD:"#77c9ff",EUR:"#8d9bff",RUB:"#ff8f9e",BYN:"#7ee0a3",PLN:"#ffc66d",GBP:"#b69cff",KZT:"#65d9d0",BTC:"#ffad66",XAU:"#f0d36b",CNY:"#ff86c8"};
function readHistory(){try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");return Array.isArray(v)?v.filter(x=>x&&Number.isFinite(x.t)&&x.p&&typeof x.p==="object"):[]}catch(_){return[]}}
function recordHistory(){const now=Date.now(),prices={};for(const a of ASSETS){const rate=rates[a.code]?.value;if(Number.isFinite(rate)&&rate>0)prices[a.code]=1/rate}if(!Object.keys(prices).length)return;const hist=readHistory(),last=hist[hist.length-1];if(last&&now-last.t<900000){last.t=now;last.p=prices}else hist.push({t:now,p:prices});try{localStorage.setItem(HISTORY_KEY,JSON.stringify(hist.slice(-120)))}catch(_){}}
function sparkline(values){const w=160,h=42,pad=3,nums=values.filter(Number.isFinite);if(!nums.length)return"";if(nums.length===1)return '<svg class="chart-spark" viewBox="0 0 160 42" preserveAspectRatio="none" aria-hidden="true"><path d="M3 21 L157 21" opacity=".18"/><circle cx="157" cy="21" r="3"/></svg>';const min=Math.min(...nums),max=Math.max(...nums),span=max-min||Math.max(Math.abs(max)*.002,1e-12);const pts=nums.map((v,i)=>[pad+i*(w-pad*2)/(nums.length-1),h-pad-((v-min)/span)*(h-pad*2)]);const line=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(2)+" "+p[1].toFixed(2)).join(" "),area=line+" L"+pts[pts.length-1][0].toFixed(2)+" "+(h-pad)+" L"+pts[0][0].toFixed(2)+" "+(h-pad)+" Z",last=pts[pts.length-1];return '<svg class="chart-spark" viewBox="0 0 160 42" preserveAspectRatio="none" aria-hidden="true"><path class="spark-area" d="'+area+'"/><path d="'+line+'"/><circle cx="'+last[0]+'" cy="'+last[1]+'" r="3"/></svg>'}
function renderCharts(){const grid=$("chartGrid");if(!grid)return;const hist=readHistory();$("chartSummary").textContent=hist.length>1?hist.length+" сохранённых точек · "+new Date(hist[0].t).toLocaleDateString("ru-RU")+" — "+new Date(hist[hist.length-1].t).toLocaleDateString("ru-RU"):hist.length===1?"Первая точка сохранена · динамика проявится после следующих обновлений":"Ожидаем первый снимок курса";grid.innerHTML=ASSETS.map((a,i)=>{const rate=rates[a.code]?.value,price=Number.isFinite(rate)&&rate>0?1/rate:null,series=hist.map(x=>Number(x.p[a.code])).filter(v=>Number.isFinite(v)&&v>0),first=series[0],last=series[series.length-1],change=series.length>1&&first>0?(last/first-1)*100:null;const changeHTML=change===null?'<span class="chart-change neutral">· собираем</span>':'<span class="chart-change">'+(change>0?"↗ ":change<0?"↘ ":"→ ")+(change>0?"+":"")+change.toLocaleString("ru-RU",{maximumFractionDigits:2})+'%</span>',priceHTML=price===null?"Нет курса":'$'+new Intl.NumberFormat("ru-RU",{maximumFractionDigits:a.code==="BTC"?0:a.code==="XAU"?2:6,minimumFractionDigits:0}).format(price),detail=series.length>1?"История обновлений":series.length===1?"Первый снимок":"Текущий снимок";return '<article class="chart-card glass" style="--chart-color:'+(CHART_COLORS[a.code]||"#8d9bff")+';--chart-i:'+i+'"><div class="chart-top"><div class="chart-asset"><span class="chart-asset-icon">'+a.icon+'</span><div><div class="chart-code">'+a.code+'</div><div class="chart-name">'+a.name+'</div></div></div><i class="chart-light" aria-hidden="true"></i></div><div class="chart-price">'+priceHTML+' <small>USD</small></div>'+(series.length?sparkline(series):(price!==null?sparkline([price]):'<div class="chart-empty">Ожидаем доступный курс</div>'))+'<div class="chart-foot"><span>'+detail+'</span>'+changeHTML+'</div></article>'}).join("")}
const THEME_KEY="gpd-cash-theme";
const THEME_MODES=["auto","light","dark"];
const THEME_GLYPHS={auto:"◐",light:"☼",dark:"☾"};
function applyTheme(mode,save=true){
 if(!THEME_MODES.includes(mode))mode="auto";
 document.documentElement.dataset.theme=mode;
 if(save)try{localStorage.setItem(THEME_KEY,mode)}catch(_){}
 document.querySelectorAll("[data-theme-choice]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.themeChoice===mode)));
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=mode==="dark"?"#171816":"#eeefec";
}
function cycleTheme(){let mode="auto";try{mode=localStorage.getItem(THEME_KEY)||"auto"}catch(_){}applyTheme(THEME_MODES[(THEME_MODES.indexOf(mode)+1)%THEME_MODES.length],true)}
const list=$("currencyList");
function fmt(n,d=2){if(!Number.isFinite(n))return"—";return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:d,minimumFractionDigits:0}).format(n)}
function parseValue(v){if(typeof v!=="string")return null;const s=v.trim().replace(/,/g,".").replace(/(?:BYN|USD|EUR|RUB|PLN|GBP|KZT|BTC|XAU|CNY|zł|₿|[$€₽¥])/gi,"").replace(/\s/g,"");if(!s)return null;const n=Number(s);return Number.isFinite(n)&&n>=0?n:null}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderPicker(){
 $("currencyPicker").innerHTML=ASSETS.map(a=>'<button type="button" class="currency-chip" data-code="'+a.code+'" aria-pressed="'+(a.code===activeCode)+'"><span class="chip-icon">'+a.icon+'</span>'+a.code+'</button>').join("");
 $("currencyPicker").querySelectorAll("[data-code]").forEach(b=>b.addEventListener("click",()=>activate(b.dataset.code)));
}
function amountHTML(n,d=2){if(!Number.isFinite(n))return "—";const parts=new Intl.NumberFormat("ru-RU",{maximumFractionDigits:d,minimumFractionDigits:0}).format(n).split(",");return '<span class="amount-major">'+parts[0]+'</span>'+(parts[1]?'<span class="amount-minor">,'+parts[1]+'</span>':"")}
function renderRows(){
 list.innerHTML=ASSETS.map((a,i)=>'<div class="currency-row '+(a.code===activeCode?"active":"")+'" data-row="'+a.code+'" style="--i:'+i+'"><div class="currency-info"><div class="currency-icon">'+a.icon+'</div><div><div class="currency-symbol">'+a.code+'</div><div class="currency-name">'+a.name+'</div></div></div><div class="amount-wrap"><div class="result-amount" id="result-'+a.code+'">'+amountHTML(null)+'</div><span class="result-unit">'+(a.code==="XAU"?"г золота":a.code)+'</span></div><button class="copy-button" type="button" data-copy="'+a.code+'" aria-label="Скопировать сумму в '+a.code+'"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></button></div>').join("");
 list.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>{const code=b.dataset.copy,n=converted(code);if(n===null){showToast("Курс пока недоступен");return}const value=fmt(n,ASSETS.find(a=>a.code===code).digits);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(()=>showToast("Скопировано: "+value+" "+code)).catch(()=>showToast(value+" "+code));else showToast(value+" "+code)}));
}
function converted(code){
 const raw=$("sourceAmount").value.trim().replace(/\s/g,"").replace(",",".");
 const amount=raw===""?null:Number(raw),base=rates[activeCode]?.value,target=rates[code]?.value;
 if(amount===null||!Number.isFinite(amount)||amount<0||!(base>0)||!(target>0))return null;
 return amount*target/base;
}
function updateResults(){
 const raw=$("sourceAmount").value.trim().replace(/\s/g,"").replace(",",".");
 const amount=raw===""||!Number.isFinite(Number(raw))||Number(raw)<0?null:Number(raw);
 $("resultsCaption").textContent="из "+(amount===null?"—":fmt(amount,8))+" "+activeCode;
 for(const a of ASSETS){const el=$("result-"+a.code);if(!el)continue;const n=converted(a.code);el.innerHTML=amountHTML(n,a.digits);list.querySelector('[data-row="'+a.code+'"]').classList.toggle("active",a.code===activeCode)}
}
function activate(code){
 activeCode=code;
 renderPicker();
 $("selectedCurrencyLabel").textContent=code+" · "+ASSETS.find(a=>a.code===code).name;
 updateResults();updatePair();
}
function convertFrom(code,raw){activeCode=code;updateResults();updatePair()}
function updateSubs(){
 for(const a of ASSETS){const el=$("sub-"+a.code),entry=rates[a.code];if(!entry){el.textContent="Курс недоступен";continue}const n=entry.sources?.length||0;el.textContent=a.code===activeCode?"Исходная сумма":n>1?n+" источника · среднее":n===1?"1 источник":"Базовая валюта"}
}
function updatePair(){
 const base=rates[activeCode]?.value,sourceList=rates[activeCode]?.sources||[];
 $("pairTitle").textContent=activeCode==="XAU"?"Курс · золото за грамм":"Курс · "+activeCode;
 if(!Number.isFinite(base)||base<=0){$("pairRate").textContent="Нет доступного курса";$("pairMeta").textContent="Попробуй обновить данные";$("checkPill").className="check-pill bad";$("checkPill").textContent="Нет данных";return}
 const count=sourceList.length;
 $("pairRate").textContent=(activeCode==="XAU"?"1 г золота":"1 "+activeCode)+" = "+ASSETS.filter(a=>a.code!=="USD"&&rates[a.code]).map(a=>fmt(rates[a.code].value/base,a.digits)+" "+a.code).join(" · ");
 $("pairMeta").textContent=count>1?"Среднее арифметическое "+count+" доступных значений для "+activeCode:count===1?"Доступен один источник для "+activeCode:"Базовый курс";
 $("checkPill").className="check-pill "+(count>1?"good":"");$("checkPill").textContent=count>1?"Усреднено":"Источников: "+count;
 $("sourceCount").textContent="· "+count+" для "+activeCode;
}
async function getJSON(url,timeout=9000){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
 try{const res=await fetch(url,{signal:ctrl.signal,cache:"no-store"});if(!res.ok)throw Error("HTTP "+res.status);return await res.json()}finally{clearTimeout(timer)}
}
function addCandidate(candidates,code,value,source){if(!Number.isFinite(value)||value<=0)return;(candidates[code]??=[]).push({name:source,value})}
async function getPrimary(){
 const d=await getJSON(API.primary);
 if(d.result!=="success"||!d.rates||!Number.isFinite(Number(d.rates.USD)))throw Error("Primary feed invalid");
 const out={};for(const a of ASSETS.filter(a=>a.kind==="fiat")){const value=Number(d.rates[a.code]);if(Number.isFinite(value)&&value>0)out[a.code]=value}
 if(!out.USD)out.USD=1;
 return {rates:out,updated:d.time_last_update_utc||null};
}
async function getSecondary(){
 const codes=["EUR","PLN","CNY","RUB","GBP"];
 const results=await Promise.allSettled(codes.map(async code=>{
  const d=await getJSON(API.secondary(code),7000);const value=Number(d.rate);
  if(!Number.isFinite(value)||value<=0)throw Error("Invalid quote");
  return {code,value,date:d.date||null};
 }));
 const out={};results.forEach(r=>{if(r.status==="fulfilled")out[r.value.code]=r.value});return out;
}
async function getBelarusbank(){
 // City-specific bank cash rates are optional: Belarusbank may block cross-origin browser requests.
 const url=API.belarusbank+"?"+new URLSearchParams({city:"Орша",currency:"USD"});
 const d=await getJSON(url,6500);
 const queue=[d];let midpoint=null;
 while(queue.length){
  const item=queue.shift();if(!item||typeof item!=="object")continue;
  const fields={};for(const [key,value] of Object.entries(item))fields[key.toLowerCase()]=value;
  const buy=Number(fields.usd_in??fields.buy??fields.in??fields.rate_in);
  const sell=Number(fields.usd_out??fields.sell??fields.out??fields.rate_out);
  if(Number.isFinite(buy)&&buy>0&&Number.isFinite(sell)&&sell>0){midpoint=(buy+sell)/2;break}
  for(const value of Object.values(item))if(value&&typeof value==="object")queue.push(value);
 }
 if(!Number.isFinite(midpoint)||midpoint<=0)throw Error("Belarusbank response not recognised");
 return midpoint;
}
async function getMarket(){
 const results=await Promise.allSettled([
  getJSON(API.bitcoin,8500).then(d=>{const n=Number(d?.bitcoin?.usd);if(!Number.isFinite(n)||n<=0)throw Error("BTC quote invalid");return n}),
  getJSON(API.gold,8500).then(d=>{const n=Number(d?.price);if(!Number.isFinite(n)||n<=0)throw Error("Gold quote invalid");return n})
 ]);
 return {btc:results[0].status==="fulfilled"?results[0].value:null,gold:results[1].status==="fulfilled"?results[1].value:null};
}
function average(entries){return entries.reduce((s,e)=>s+e.value,0)/entries.length}
function setStatus(message,type=""){$("status").textContent=message;$("status").className="status"+(type?" "+type:"")}
function setLive(label,state=""){$("liveLabel").textContent=label;$("liveDot").className="live-dot "+state}
function refreshSourceInfo(){
 $("sourcePrimary").textContent=sourceState.primary?"Подключён · фиатные курсы":"Нет данных";
 const checked=Object.keys(sourceState.secondary);
 $("sourceSecondary").textContent=checked.length?"Доступно: "+checked.join(", "):"Второй источник не вернул данные";
 $("sourceBelarusbank").textContent=sourceState.belarusbank?"Подключён · Орша · среднее покупки/продажи":"Недоступен в браузере или ответ не распознан";
 $("sourceBTC").textContent=sourceState.btc?"Котировка доступна":"Котировка недоступна";
 $("sourceGold").textContent=sourceState.gold?"Котировка доступна":"Котировка недоступна";
 const ok=Number(sourceState.primary)+Number(Object.keys(sourceState.secondary).length>0)+Number(sourceState.btc)+Number(sourceState.gold)+Number(sourceState.belarusbank);
 setLive(ok>=2?"Источники доступны":ok===1?"Часть источников доступна":"Нет соединения",ok>=2?"good":ok===0?"bad":"");
}
async function refreshAll(){
 if(loading)return;loading=true;const id=++refreshId;$("refreshButton").disabled=true;document.body.classList.add("loading");setStatus("Получаем курсы из нескольких источников…");setLive("Проверяем…");
 const [p,s,m,b]=await Promise.allSettled([getPrimary(),getSecondary(),getMarket(),getBelarusbank()]);
 if(id!==refreshId)return;
 const candidates={};
 sourceState.primary=p.status==="fulfilled";
 if(p.status==="fulfilled"){Object.entries(p.value.rates).forEach(([code,value])=>addCandidate(candidates,code,value,"ExchangeRate-API"));lastUpdated=p.value.updated}
 sourceState.secondary=s.status==="fulfilled"?s.value:{};
 Object.entries(sourceState.secondary).forEach(([code,item])=>addCandidate(candidates,code,item.value,"Frankfurter"));
 sourceState.belarusbank=b.status==="fulfilled";
 if(sourceState.belarusbank)addCandidate(candidates,"BYN",b.value,"Беларусбанк · Орша, средний наличный курс");
 const market=m.status==="fulfilled"?m.value:{btc:null,gold:null};
 sourceState.btc=Number.isFinite(market.btc);sourceState.gold=Number.isFinite(market.gold);
 if(market.btc)addCandidate(candidates,"BTC",1/market.btc,"CoinGecko");
 if(market.gold)addCandidate(candidates,"XAU",31.1034768/market.gold,"Gold-API · грамм на USD");
 const next={};
 for(const a of ASSETS){const entries=candidates[a.code]||[];if(entries.length)next[a.code]={value:average(entries),sources:entries}}
 next.USD={value:1,sources:candidates.USD||[{name:"USD base",value:1}]};
 if(next.USD)rates=next;
 if(p.status==="fulfilled")recordHistory();refreshSourceInfo();updateResults();updatePair();renderCharts();
 const available=Object.keys(rates).length;
 if(p.status==="fulfilled"){
  const averaged=Object.values(rates).filter(r=>r.sources.length>1).length;
  const when=lastUpdated?" · обновление источника "+new Date(lastUpdated).toLocaleString("ru-RU",{timeZone:"UTC",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})+" UTC":"";
  $("updatedLabel").textContent="Данные обновлены"+when;
  setStatus("Курсы загружены: "+available+" активов. Для "+averaged+" активов усреднены несколько источников.","success");
 }else{
  $("updatedLabel").textContent="Нет свежего обновления";
  setStatus("Основной источник недоступен. Доступные активы могут быть ограничены; попробуй обновить ещё раз.","error");
 }
 updateResults();
 loading=false;$("refreshButton").disabled=false;document.body.classList.remove("loading");
}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1900)}
document.querySelectorAll("[data-theme-choice]").forEach(b=>b.addEventListener("click",()=>applyTheme(b.dataset.themeChoice)));
try{applyTheme(localStorage.getItem(THEME_KEY)||"auto",false)}catch(_){applyTheme("auto",false)}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{let mode="auto";try{mode=localStorage.getItem(THEME_KEY)||"auto"}catch(_){}if(mode==="auto")applyTheme("auto",false)});
$("sourceAmount").addEventListener("input",updateResults);
$("refreshButton").addEventListener("click",refreshAll);
$("resetButton").addEventListener("click",()=>{$("sourceAmount").value="1";activate("USD");showToast("Сброшено к 1 USD")});
$("sourceToggle").addEventListener("click",()=>{const open=$("sourceToggle").getAttribute("aria-expanded")!=="true";$("sourceToggle").setAttribute("aria-expanded",String(open));$("sourcePanel").hidden=!open;$("sourceArrow").textContent=open?"−":"＋"});
$("year").textContent=new Date().getFullYear();$("assetCount").textContent=ASSETS.length+" активов";
renderPicker();renderRows();activate("USD");renderCharts();refreshAll();
