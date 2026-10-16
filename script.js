"use strict";
const ASSETS=[
 {code:"USD",name:"Доллар США",icon:"🇺🇸",kind:"fiat",digits:2},
 {code:"EUR",name:"Евро",icon:"🇪🇺",kind:"fiat",digits:2},
 {code:"RUB",name:"Российский рубль",icon:"🇷🇺",kind:"fiat",digits:2},
 {code:"BYN",name:"Белорусский рубль",icon:"🇧🇾",kind:"fiat",digits:2},
 {code:"PLN",name:"Польский злотый",icon:"🇵🇱",kind:"fiat",digits:2},
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
const THEME_KEY="gpd-cash-theme";
const THEME_MODES=["auto","light","dark"];
const THEME_GLYPHS={auto:"◐",light:"☼",dark:"☾"};
function applyTheme(mode,announce=false){
 if(!THEME_MODES.includes(mode))mode="auto";
 document.documentElement.dataset.theme=mode;
 document.documentElement.style.colorScheme=mode==="auto"?"light dark":mode;
 try{localStorage.setItem(THEME_KEY,mode)}catch(_){}
 const b=$("themeButton"),names={auto:"Авто",light:"Светлая",dark:"Тёмная"};
 if(b){b.textContent=THEME_GLYPHS[mode];b.title="Тема: "+names[mode]+" · нажми, чтобы сменить";b.setAttribute("aria-label","Тема: "+names[mode])}
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=mode==="light"?"#e9eee8":mode==="dark"?"#090c0a":(matchMedia("(prefers-color-scheme: dark)").matches?"#090c0a":"#e9eee8");
 if(announce)showToast("Тема: "+names[mode]);
}
function cycleTheme(){let current="auto";try{current=localStorage.getItem(THEME_KEY)||"auto"}catch(_){}applyTheme(THEME_MODES[(THEME_MODES.indexOf(current)+1)%THEME_MODES.length],true)}
const list=$("currencyList");
function fmt(n,d=2){if(!Number.isFinite(n))return"—";return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:d,minimumFractionDigits:0}).format(n)}
function parseValue(v){if(typeof v!=="string")return null;const s=v.trim().replace(/,/g,".").replace(/(?:BYN|USD|EUR|RUB|PLN|BTC|XAU|CNY|zł|₿|[$€₽¥])/gi,"").replace(/\s/g,"");if(!s)return null;const n=Number(s);return Number.isFinite(n)&&n>=0?n:null}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderRows(){
 list.innerHTML=ASSETS.map((a,i)=>`<div class="currency-row ${a.code===activeCode?"active":""}" data-row="${a.code}" style="--i:${i}">
 <div class="currency-info"><div class="currency-icon" aria-hidden="true">${a.icon}</div><div class="currency-labels"><div class="currency-symbol">${a.code}</div><div class="currency-name">${a.name}</div></div></div>
 <div class="amount-wrap"><input class="amount-input" id="amount-${a.code}" data-code="${a.code}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Сумма в ${a.code}" placeholder="—" value="${a.code==="USD"?"1":""}"><div class="row-sub" id="sub-${a.code}">${a.code==="USD"?"Базовая валюта":"Курс загружается"}</div></div>
 </div>`).join("");
 list.querySelectorAll(".amount-input").forEach(input=>{
  input.addEventListener("focus",()=>activate(input.dataset.code));
  input.addEventListener("click",()=>activate(input.dataset.code));
  input.addEventListener("input",()=>{activeCode=input.dataset.code;list.querySelectorAll(".currency-row").forEach(r=>r.classList.toggle("active",r.dataset.row===activeCode));convertFrom(input.dataset.code,input.value)});
 });
}
function activate(code){activeCode=code;list.querySelectorAll(".currency-row").forEach(r=>r.classList.toggle("active",r.dataset.row===code));updatePair()}
function convertFrom(code,raw){
 const amount=parseValue(raw);
 for(const a of ASSETS){const input=$("amount-"+a.code);if(a.code!==code)input.value="";}
 if(amount===null){updateSubs();updatePair();return}
 const base=rates[code]?.value;
 if(!Number.isFinite(base)||base<=0){updateSubs();updatePair();return}
 for(const a of ASSETS){if(a.code===code)continue;const target=rates[a.code]?.value;const input=$("amount-"+a.code);input.value=Number.isFinite(target)&&target>0?fmt(amount*target/base,a.digits):"";}
 updateSubs();updatePair();
}
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
 const codes=["EUR","PLN","CNY","RUB"];
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
 refreshSourceInfo();updateSubs();updatePair();
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
 const activeInput=$("amount-"+activeCode);if(activeInput&&activeInput.value!=="")convertFrom(activeCode,activeInput.value);
 loading=false;$("refreshButton").disabled=false;document.body.classList.remove("loading");
}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1900)}
$("themeButton").addEventListener("click",cycleTheme);
try{applyTheme(localStorage.getItem(THEME_KEY)||"auto")}catch(_){applyTheme("auto")}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{let mode="auto";try{mode=localStorage.getItem(THEME_KEY)||"auto"}catch(_){}if(mode==="auto")applyTheme("auto")});
$("refreshButton").addEventListener("click",refreshAll);
$("resetButton").addEventListener("click",()=>{ASSETS.forEach(a=>$("amount-"+a.code).value="");activeCode="USD";$("amount-USD").value="1";activate("USD");convertFrom("USD","1");showToast("Суммы сброшены")});
$("sourceToggle").addEventListener("click",()=>{const open=$("sourceToggle").getAttribute("aria-expanded")!=="true";$("sourceToggle").setAttribute("aria-expanded",String(open));$("sourcePanel").hidden=!open;$("sourceArrow").textContent=open?"−":"＋"});
$("year").textContent=new Date().getFullYear();$("assetCount").textContent=ASSETS.length+" активов";
renderRows();convertFrom("USD","1");refreshAll();
