"use strict";

const OBSERVATIONS = window.CORVALLIS_WEATHER_DATA || [];
const MONTHLY_COMPARISON = window.CORVALLIS_MONTHLY_COMPARISON || [];

const answers = { q1:"c", q2:"c", q3:"c", q4:"d" };
const feedbackText = {
  q1:"Correct. Across April–September, the average temperature departure was +1.1°F and total precipitation was 0.79 inches below normal.",
  q2:"Correct. June–August averaged 1.9°F above normal and received 0.36 inches more precipitation than normal.",
  q3:"Correct. A precipitation total does not show distribution. Several rain events can raise the total while long dry periods occur between them.",
  q4:"Correct. No single value explains the gardener’s experience. Warmer temperatures, lower growing-season precipitation, and uneven summer rainfall all contribute to the explanation."
};

let currentQuestion = 0;
const completed = new Set();

function signed(value,digits,suffix){
  const prefix=value>0?"+":"";
  return `${prefix}${value.toFixed(digits)}${suffix}`;
}

function buildComparisonTables(){
  const tempBody=document.querySelector("#temperature-comparison-body");
  const rainBody=document.querySelector("#precipitation-comparison-body");
  tempBody.innerHTML="";
  rainBody.innerHTML="";
  MONTHLY_COMPARISON.forEach(row=>{
    const trT=document.createElement("tr");
    [
      row.month,
      `${row.observedMax.toFixed(1)}°F`,
      `${row.normalMax.toFixed(1)}°F`,
      signed(row.observedMax-row.normalMax,1,"°F")
    ].forEach((value,index)=>{
      const cell=document.createElement(index===0?"th":"td");
      if(index===0)cell.scope="row";
      if(index===3)cell.className="difference-value";
      cell.textContent=value;
      trT.appendChild(cell);
    });
    tempBody.appendChild(trT);

    const trP=document.createElement("tr");
    [
      row.month,
      `${row.observedPrecip.toFixed(2)} in`,
      `${row.normalPrecip.toFixed(2)} in`,
      signed(row.observedPrecip-row.normalPrecip,2," in")
    ].forEach((value,index)=>{
      const cell=document.createElement(index===0?"th":"td");
      if(index===0)cell.scope="row";
      if(index===3)cell.className="difference-value";
      cell.textContent=value;
      trP.appendChild(cell);
    });
    rainBody.appendChild(trP);
  });
}

function buildDailyTable(){
  const body=document.querySelector("#daily-table-body");
  body.innerHTML="";
  OBSERVATIONS.forEach(item=>{
    const row=document.createElement("tr");
    const date=document.createElement("th");
    date.scope="row";
    date.textContent=new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
    const temp=document.createElement("td");
    temp.textContent=item.maxTemp.toFixed(1);
    const rain=document.createElement("td");
    rain.textContent=item.precipitation.toFixed(2);
    row.append(date,temp,rain);
    body.appendChild(row);
  });
}

function buildChart(){
  const container=document.querySelector("#weather-chart");
  const showTemp=document.querySelector("#show-temperature");
  const showRain=document.querySelector("#show-precipitation");

  function draw(){
    const width=Math.max(container.clientWidth||720,320);
    const height=380;
    const margin={top:28,right:58,bottom:46,left:56};
    const plotWidth=width-margin.left-margin.right;
    const plotHeight=height-margin.top-margin.bottom;
    const temps=OBSERVATIONS.map(d=>d.maxTemp);
    const rains=OBSERVATIONS.map(d=>d.precipitation);
    const tempMin=Math.floor((Math.min(...temps)-5)/5)*5;
    const tempMax=Math.ceil((Math.max(...temps)+5)/5)*5;
    const rainMax=Math.max(1.5,Math.ceil(Math.max(...rains)*4)/4);
    const x=i=>margin.left+(i/Math.max(OBSERVATIONS.length-1,1))*plotWidth;
    const yT=v=>margin.top+((tempMax-v)/(tempMax-tempMin))*plotHeight;
    const yR=v=>margin.top+plotHeight-(v/rainMax)*plotHeight;
    const ns="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
    svg.setAttribute("aria-hidden","true");

    const add=(tag,attrs={},text="")=>{
      const el=document.createElementNS(ns,tag);
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
      if(text)el.textContent=text;
      svg.appendChild(el);
      return el;
    };

    const css=getComputedStyle(document.documentElement);
    const ink=css.getPropertyValue("--ink").trim();
    const muted=css.getPropertyValue("--muted").trim();
    const border=css.getPropertyValue("--border").trim();
    const tempColor=css.getPropertyValue("--temp").trim();
    const rainColor=css.getPropertyValue("--rain").trim();

    for(let i=0;i<=5;i++){
      const value=tempMin+((tempMax-tempMin)*i)/5;
      const y=yT(value);
      add("line",{x1:margin.left,y1:y,x2:width-margin.right,y2:y,stroke:border,"stroke-width":1});
      add("text",{x:margin.left-8,y:y+4,"text-anchor":"end",fill:muted,"font-size":12},`${Math.round(value)}°`);
    }

    const monthStarts=OBSERVATIONS.map((item,index)=>({item,index}))
      .filter(({item,index})=>index===0||item.date.slice(5,7)!==OBSERVATIONS[index-1].date.slice(5,7));
    monthStarts.forEach(({item,index})=>{
      add("text",{x:x(index),y:height-16,"text-anchor":index===0?"start":"middle",fill:muted,"font-size":12},
        new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"}));
    });

    if(showRain.checked){
      const bw=Math.max(1,plotWidth/OBSERVATIONS.length-.4);
      OBSERVATIONS.forEach((d,i)=>{
        if(d.precipitation<=0)return;
        const top=yR(d.precipitation);
        add("rect",{x:x(i)-bw/2,y:top,width:bw,height:margin.top+plotHeight-top,fill:rainColor,opacity:.72});
      });
    }
    if(showTemp.checked){
      add("polyline",{
        points:OBSERVATIONS.map((d,i)=>`${x(i)},${yT(d.maxTemp)}`).join(" "),
        fill:"none",stroke:tempColor,"stroke-width":2.6,"stroke-linejoin":"round","stroke-linecap":"round"
      });
    }

    add("line",{x1:margin.left,y1:14,x2:margin.left+24,y2:14,stroke:tempColor,"stroke-width":4});
    add("text",{x:margin.left+31,y:18,fill:ink,"font-size":12},"Daily high");
    add("rect",{x:margin.left+115,y:7,width:15,height:12,fill:rainColor,opacity:.72});
    add("text",{x:margin.left+137,y:18,fill:ink,"font-size":12},"Precipitation");
    container.replaceChildren(svg);
  }

  showTemp.addEventListener("change",draw);
  showRain.addEventListener("change",draw);
  let timer;
  window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(draw,120)});
  draw();
}

function setupTableToggle(){
  const button=document.querySelector("#toggle-daily-table");
  const region=document.querySelector("#daily-table-wrap");
  button.addEventListener("click",()=>{
    const opening=region.hidden;
    region.hidden=!opening;
    button.setAttribute("aria-expanded",String(opening));
    button.textContent=opening?"Hide daily data table":"View daily data table";
  });
}

function showQuestion(index,focus=true){
  const slides=[...document.querySelectorAll(".question-slide")];
  currentQuestion=Math.max(0,Math.min(index,slides.length-1));
  slides.forEach((slide,i)=>slide.hidden=i!==currentQuestion);
  document.querySelector("#previous-question").disabled=currentQuestion===0;
  const next=document.querySelector("#next-question");
  next.textContent=currentQuestion===slides.length-1?"Finish investigation":"Next question";
  document.querySelector("#progress-text").textContent=`Question ${currentQuestion+1} of ${slides.length}`;
  document.querySelector("#progress-bar").style.width=`${((currentQuestion+1)/slides.length)*100}%`;
  if(focus){
    slides[currentQuestion].querySelector("legend").setAttribute("tabindex","-1");
    slides[currentQuestion].querySelector("legend").focus();
  }
}

function setupQuiz(){
  document.querySelectorAll(".check-answer").forEach(button=>{
    button.addEventListener("click",()=>{
      const slide=button.closest(".question-slide");
      const id=slide.dataset.question;
      const selected=slide.querySelector(`input[name="${id}"]:checked`);
      const feedback=slide.querySelector(".feedback");
      if(!selected){
        feedback.className="feedback incorrect";
        feedback.textContent="Choose an answer before checking.";
        return;
      }
      const correct=selected.value===answers[id];
      feedback.className=`feedback ${correct?"correct":"incorrect"}`;
      feedback.textContent=correct?feedbackText[id]:"Not quite. Review the evidence and try again.";
      if(correct)completed.add(id);else completed.delete(id);
    });
  });

  document.querySelector("#previous-question").addEventListener("click",()=>showQuestion(currentQuestion-1));
  document.querySelector("#next-question").addEventListener("click",()=>{
    const slides=[...document.querySelectorAll(".question-slide")];
    if(currentQuestion<slides.length-1){
      showQuestion(currentQuestion+1);
    }else{
      const completion=document.querySelector("#completion-message");
      completion.hidden=false;
      completion.focus();
    }
  });
  showQuestion(0,false);
}

function initialize(){
  try{
    if(!OBSERVATIONS.length||!MONTHLY_COMPARISON.length)throw new Error("Local data missing.");
    buildComparisonTables();
    buildDailyTable();
    buildChart();
    setupTableToggle();
    setupQuiz();
    document.querySelector("#data-status").textContent=
      `Ready: ${OBSERVATIONS.length} daily observations and six monthly comparisons loaded.`;
  }catch(error){
    console.error(error);
    const status=document.querySelector("#data-status");
    status.className="status error";
    status.textContent="The activity data could not be displayed. Please verify that weather-data.js is uploaded beside index.html.";
  }
}
document.addEventListener("DOMContentLoaded",initialize);
