"use strict";
const DATA=window.CORVALLIS_WEATHER_DATA||[];
let current=0, dailyBuilt=false;
const answers={q1:"c",q2:"b",q3:"c",q4:"d"};
const feedback={
q1:"Correct. The graph shows changing temperatures and distinct rain events separated by dry intervals.",
q2:"Correct. The longer growing season was warmer and drier overall, while summer was warmer with slightly above-normal precipitation.",
q3:"Correct. Total precipitation describes amount, but the daily pattern shows that rain was concentrated in a few events with dry periods between them.",
q4:"Correct. The combined evidence—not any single value—best explains the gardener’s experience."
};
const screens=[...document.querySelectorAll(".screen")], stepItems=[...document.querySelectorAll(".steps li")];
const prev=document.querySelector("#previous"),next=document.querySelector("#next"),label=document.querySelector("#step-label");
function show(i){
 current=Math.max(0,Math.min(i,screens.length-1));
 screens.forEach((s,n)=>s.classList.toggle("active",n===current));
 stepItems.forEach((s,n)=>{s.classList.toggle("active",n===current);s.classList.toggle("complete",n<current)});
 prev.disabled=current===0; next.disabled=current===0||current===screens.length-1;
 label.textContent=["Introduction","Daily weather","Climate summaries","Rainfall distribution","Solve the mystery","Complete"][current];
 next.textContent=current===4?"See conclusion":"Next";
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelector(".begin").addEventListener("click",()=>show(1));
document.querySelector(".restart").addEventListener("click",()=>{document.querySelectorAll('input[type="radio"]').forEach(i=>i.checked=false);
 document.querySelector("#show-temperature").checked=true;
 document.querySelector("#show-precipitation").checked=true;
 drawWeatherChart();document.querySelectorAll(".feedback").forEach(f=>{f.textContent="";f.className="feedback"});show(0)});
prev.addEventListener("click",()=>show(current-1));next.addEventListener("click",()=>show(current+1));
document.querySelectorAll(".check").forEach(btn=>btn.addEventListener("click",()=>{
 const fs=btn.closest("fieldset"),id=fs.dataset.question,selected=fs.querySelector(`input[name="${id}"]:checked`),fb=fs.querySelector(".feedback");
 if(!selected){fb.className="feedback incorrect";fb.textContent="Choose an answer before checking.";return}
 const ok=selected.value===answers[id];fb.className=`feedback ${ok?"correct":"incorrect"}`;fb.textContent=ok?feedback[id]:"Not quite. Review the evidence beside the question and try again.";
 if(ok){next.disabled=false;if(current===4)next.textContent="See conclusion"}
}));
function buildDaily(){
 if(dailyBuilt)return;const body=document.querySelector("#daily-table-body"),frag=document.createDocumentFragment();
 DATA.forEach(d=>{const r=document.createElement("tr"),a=document.createElement("th"),b=document.createElement("td"),c=document.createElement("td");a.scope="row";a.textContent=new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"});b.textContent=d.maxTemp.toFixed(1);c.textContent=d.precipitation.toFixed(2);r.append(a,b,c);frag.appendChild(r)});body.appendChild(frag);dailyBuilt=true
}
document.querySelector("#toggle-daily-table").addEventListener("click",e=>{const w=document.querySelector("#daily-table-wrap"),open=w.hidden;if(open)buildDaily();w.hidden=!open;e.currentTarget.setAttribute("aria-expanded",String(open));e.currentTarget.textContent=open?"Hide daily data table":"View daily data table"});
function drawWeatherChart() {
 const container = document.querySelector("#weather-chart");
 const showTemperature = document.querySelector("#show-temperature").checked;
 const showPrecipitation = document.querySelector("#show-precipitation").checked;

 const width = Math.max(container.clientWidth || 700, 320);
 const height = 420;
 const margin = {top:34, right:64, bottom:46, left:64};
 const plotWidth = width - margin.left - margin.right;
 const plotHeight = height - margin.top - margin.bottom;
 const ns = "http://www.w3.org/2000/svg";

 const svg = document.createElementNS(ns, "svg");
 svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
 svg.setAttribute("aria-hidden", "true");

 const add = (tag, attrs = {}, text = "") => {
   const element = document.createElementNS(ns, tag);
   Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
   if (text) element.textContent = text;
   svg.appendChild(element);
   return element;
 };

 const css = getComputedStyle(document.documentElement);
 const gridColor = css.getPropertyValue("--line").trim() || "#d6dde2";
 const muted = css.getPropertyValue("--muted").trim() || "#5f6876";
 const temperatureColor = css.getPropertyValue("--orange").trim() || "#dc551f";
 const precipitationColor = css.getPropertyValue("--blue").trim() || "#176fbd";
 const ink = css.getPropertyValue("--ink").trim() || "#18253a";

 const temperatures = DATA.map(d => d.maxTemp);
 const precipitation = DATA.map(d => d.precipitation);
 const temperatureMin = Math.floor((Math.min(...temperatures) - 5) / 5) * 5;
 const temperatureMax = Math.ceil((Math.max(...temperatures) + 5) / 5) * 5;
 const precipitationMax = Math.max(1.5, Math.ceil(Math.max(...precipitation) * 4) / 4);

 const x = index => margin.left + index / Math.max(DATA.length - 1, 1) * plotWidth;
 const yTemperature = value => margin.top + (temperatureMax - value) / (temperatureMax - temperatureMin) * plotHeight;
 const yPrecipitation = value => margin.top + plotHeight - value / precipitationMax * plotHeight;

 // Shared horizontal grid and left temperature labels.
 for (let i = 0; i <= 5; i++) {
   const fraction = i / 5;
   const y = margin.top + plotHeight - fraction * plotHeight;
   const temperatureValue = temperatureMin + fraction * (temperatureMax - temperatureMin);
   const precipitationValue = fraction * precipitationMax;

   add("line", {
     x1:margin.left, y1:y, x2:width-margin.right, y2:y,
     stroke:gridColor, "stroke-width":1
   });

   add("text", {
     x:margin.left-9, y:y+4, "text-anchor":"end",
     fill:temperatureColor, "font-size":12, "font-weight":700
   }, `${Math.round(temperatureValue)}°`);

   add("text", {
     x:width-margin.right+9, y:y+4, "text-anchor":"start",
     fill:precipitationColor, "font-size":12, "font-weight":700
   }, precipitationValue.toFixed(2));
 }

 // Axis titles.
 add("text", {
   x:17, y:height/2,
   transform:`rotate(-90 17 ${height/2})`,
   "text-anchor":"middle", fill:temperatureColor,
   "font-size":12, "font-weight":700
 }, "Daily high temperature (°F)");

 add("text", {
   x:width-13, y:height/2,
   transform:`rotate(90 ${width-13} ${height/2})`,
   "text-anchor":"middle", fill:precipitationColor,
   "font-size":12, "font-weight":700
 }, "Daily precipitation (inches)");

 const monthStarts = DATA.map((d, i) => ({d, i})).filter(({d, i}) =>
   i === 0 || d.date.slice(5, 7) !== DATA[i - 1].date.slice(5, 7)
 );
 monthStarts.forEach(({d, i}) => {
   add("text", {
     x:x(i), y:height-16,
     "text-anchor":i === 0 ? "start" : "middle",
     fill:muted, "font-size":12
   }, new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", {month:"short"}));
 });

 if (showPrecipitation) {
   const barWidth = Math.max(1.2, plotWidth / DATA.length - 0.35);
   DATA.forEach((d, i) => {
     if (d.precipitation <= 0) return;
     const top = yPrecipitation(d.precipitation);
     add("rect", {
       x:x(i)-barWidth/2, y:top, width:barWidth,
       height:margin.top+plotHeight-top,
       fill:precipitationColor, opacity:0.78
     });
   });
 }

 if (showTemperature) {
   add("polyline", {
     points:DATA.map((d, i) => `${x(i)},${yTemperature(d.maxTemp)}`).join(" "),
     fill:"none", stroke:temperatureColor, "stroke-width":2.6,
     "stroke-linejoin":"round", "stroke-linecap":"round"
   });
 }

 // Legend reflects the currently visible series.
 let legendX = margin.left;
 if (showTemperature) {
   add("line", {x1:legendX,y1:16,x2:legendX+22,y2:16,stroke:temperatureColor,"stroke-width":4});
   add("text", {x:legendX+29,y:20,fill:ink,"font-size":12}, "Daily high temperature");
   legendX += 165;
 }
 if (showPrecipitation) {
   add("rect", {x:legendX,y:10,width:15,height:12,fill:precipitationColor,opacity:0.78});
   add("text", {x:legendX+22,y:20,fill:ink,"font-size":12}, "Daily precipitation");
 }

 if (!showTemperature && !showPrecipitation) {
   add("text", {
     x:width/2, y:height/2,
     "text-anchor":"middle", fill:muted, "font-size":15
   }, "Select Daily high temperature or Daily precipitation to display data.");
 }

 container.replaceChildren(svg);
}

function drawRainChart() {
 const container = document.querySelector("#rain-chart");
 const subset = DATA.filter(d => d.date >= "2024-06-01" && d.date <= "2024-08-31");
 const width = Math.max(container.clientWidth || 700, 320);
 const height = 360;
 const margin = {top:24,right:52,bottom:42,left:52};
 const plotWidth = width-margin.left-margin.right;
 const plotHeight = height-margin.top-margin.bottom;
 const ns = "http://www.w3.org/2000/svg";
 const svg = document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
 svg.setAttribute("aria-hidden","true");
 const add=(tag,attrs={},text="")=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;svg.appendChild(el);return el;};
 const css=getComputedStyle(document.documentElement);
 const line=css.getPropertyValue("--line").trim()||"#d6dde2";
 const muted=css.getPropertyValue("--muted").trim()||"#5f6876";
 const blue=css.getPropertyValue("--blue").trim()||"#176fbd";
 const maximum=Math.max(1.5,Math.ceil(Math.max(...subset.map(d=>d.precipitation))*4)/4);
 const x=i=>margin.left+i/Math.max(subset.length-1,1)*plotWidth;
 const y=v=>margin.top+plotHeight-v/maximum*plotHeight;
 for(let i=0;i<=4;i++){
   const value=maximum*i/4;
   const yy=margin.top+plotHeight-i/4*plotHeight;
   add("line",{x1:margin.left,y1:yy,x2:width-margin.right,y2:yy,stroke:line});
   add("text",{x:margin.left-8,y:yy+4,"text-anchor":"end",fill:blue,"font-size":12},value.toFixed(2));
 }
 const bw=Math.max(1.5,plotWidth/subset.length-.4);
 subset.forEach((d,i)=>{if(d.precipitation<=0)return;const top=y(d.precipitation);add("rect",{x:x(i)-bw/2,y:top,width:bw,height:margin.top+plotHeight-top,fill:blue,opacity:.8});});
 subset.map((d,i)=>({d,i})).filter(({d,i})=>i===0||d.date.slice(5,7)!==subset[i-1].date.slice(5,7)).forEach(({d,i})=>add("text",{x:x(i),y:height-14,"text-anchor":i===0?"start":"middle",fill:muted,"font-size":12},new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"})));
 add("text",{x:15,y:height/2,transform:`rotate(-90 15 ${height/2})`,"text-anchor":"middle",fill:blue,"font-size":12,"font-weight":700},"Daily precipitation (inches)");
 container.replaceChildren(svg);
}

function drawAll() {
 drawWeatherChart();
 drawRainChart();
}

document.querySelector("#show-temperature").addEventListener("change", drawWeatherChart);
document.querySelector("#show-precipitation").addEventListener("change", drawWeatherChart);
window.addEventListener("resize",()=>{clearTimeout(window._resizeTimer);window._resizeTimer=setTimeout(drawAll,120)});
drawAll();show(0);