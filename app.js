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
document.querySelector(".restart").addEventListener("click",()=>{document.querySelectorAll("input").forEach(i=>i.checked=false);document.querySelectorAll(".feedback").forEach(f=>{f.textContent="";f.className="feedback"});show(0)});
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
function svgChart(container,subset,mode="both"){
 const width=Math.max(container.clientWidth||700,320),height=mode==="rain"?360:420,m={top:26,right:48,bottom:42,left:52},pw=width-m.left-m.right,ph=height-m.top-m.bottom,ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox",`0 0 ${width} ${height}`);svg.setAttribute("aria-hidden","true");
 const add=(tag,a={},t="")=>{const el=document.createElementNS(ns,tag);Object.entries(a).forEach(([k,v])=>el.setAttribute(k,v));if(t)el.textContent=t;svg.appendChild(el);return el};
 const css=getComputedStyle(document.documentElement),line=css.getPropertyValue("--line").trim(),muted=css.getPropertyValue("--muted").trim(),orange=css.getPropertyValue("--orange").trim(),blue=css.getPropertyValue("--blue").trim();
 const temps=subset.map(d=>d.maxTemp),rains=subset.map(d=>d.precipitation),tmin=Math.floor((Math.min(...temps)-5)/5)*5,tmax=Math.ceil((Math.max(...temps)+5)/5)*5,rmax=Math.max(1.5,Math.ceil(Math.max(...rains)*4)/4);
 const x=i=>m.left+i/Math.max(subset.length-1,1)*pw,yt=v=>m.top+(tmax-v)/(tmax-tmin)*ph,yr=v=>m.top+ph-v/rmax*ph;
 if(mode!=="rain"){for(let i=0;i<=5;i++){const v=tmin+(tmax-tmin)*i/5,y=yt(v);add("line",{x1:m.left,y1:y,x2:width-m.right,y2:y,stroke:line});add("text",{x:m.left-7,y:y+4,"text-anchor":"end",fill:muted,"font-size":12},`${Math.round(v)}°`)}}
 const monthStarts=subset.map((d,i)=>({d,i})).filter(({d,i})=>i===0||d.date.slice(5,7)!==subset[i-1].date.slice(5,7));
 monthStarts.forEach(({d,i})=>add("text",{x:x(i),y:height-14,"text-anchor":i===0?"start":"middle",fill:muted,"font-size":12},new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"})));
 const bw=Math.max(1,pw/subset.length-.5);
 if(mode!=="temp")subset.forEach((d,i)=>{if(d.precipitation>0){const top=yr(d.precipitation);add("rect",{x:x(i)-bw/2,y:top,width:bw,height:m.top+ph-top,fill:blue,opacity:.78})}});
 if(mode!=="rain")add("polyline",{points:subset.map((d,i)=>`${x(i)},${yt(d.maxTemp)}`).join(" "),fill:"none",stroke:orange,"stroke-width":2.5,"stroke-linejoin":"round","stroke-linecap":"round"});
 container.replaceChildren(svg)
}
function drawAll(){
 svgChart(document.querySelector("#weather-chart"),DATA,"both");
 const summer=DATA.filter(d=>d.date>="2024-06-01"&&d.date<="2024-08-31");svgChart(document.querySelector("#rain-chart"),summer,"rain");
}
document.querySelector("#show-temperature").addEventListener("change",()=>svgChart(document.querySelector("#weather-chart"),DATA,document.querySelector("#show-precipitation").checked?"both":"temp"));
document.querySelector("#show-precipitation").addEventListener("change",()=>svgChart(document.querySelector("#weather-chart"),DATA,document.querySelector("#show-temperature").checked?"both":"rain"));
window.addEventListener("resize",()=>{clearTimeout(window._resizeTimer);window._resizeTimer=setTimeout(drawAll,120)});
drawAll();show(0);