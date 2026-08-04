"use strict";

const STATION_NAME = "Corvallis State University";
const OBSERVATIONS = window.CORVALLIS_WEATHER_DATA;
const MONTHLY_COMPARISON = window.CORVALLIS_MONTHLY_COMPARISON;

const quizKey = {
  q1: new Set(["warm-periods", "dry-periods", "daily-change", "rain-events"]),
  q2: new Set(["warmer", "drier"]),
  q3: new Set(["warmer-than-normal", "drier-than-normal"]),
  q4: new Set(["irrigation", "mulch", "heat-stress", "containers"])
};

const quizFeedback = {
  q1: "Correct. The daily record shows short-term variation, hot periods, individual rain events, and long dry stretches.",
  q2: "Correct. The monthly summaries must be compared with the normals to identify a warmer and drier-than-normal summer.",
  q3: "Correct. The words “than normal” require a comparison between the observed weather and the long-term climate reference.",
  q4: "Correct. The combined evidence supports closer attention to water loss, irrigation, container moisture, and heat stress."
};

let weatherChart = null;
const completed = new Set();

function signed(value, digits = 1, suffix = "") {
  if (value === null) return "Missing";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(digits)}${suffix}`;
}

function buildComparisonTable(summary) {
  const temperatureBody = document.querySelector("#temperature-comparison-body");
  const precipitationBody = document.querySelector("#precipitation-comparison-body");

  temperatureBody.innerHTML = "";
  precipitationBody.innerHTML = "";

  summary.forEach(row => {
    const temperatureRow = document.createElement("tr");
    const temperatureValues = [
      row.month,
      row.observedMax === null ? "Missing" : `${row.observedMax.toFixed(1)}°F`,
      `${row.normalMax.toFixed(1)}°F`,
      signed(row.observedMax === null ? null : row.observedMax - row.normalMax, 1, "°F")
    ];

    temperatureValues.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      if (index === 3) cell.classList.add("difference-value");
      cell.textContent = value;
      temperatureRow.appendChild(cell);
    });
    temperatureBody.appendChild(temperatureRow);

    const precipitationRow = document.createElement("tr");
    const precipitationValues = [
      row.month,
      row.observedPrecip === null ? "Missing" : `${row.observedPrecip.toFixed(2)} in`,
      `${row.normalPrecip.toFixed(2)} in`,
      signed(row.observedPrecip === null ? null : row.observedPrecip - row.normalPrecip, 2, " in")
    ];

    precipitationValues.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      if (index === 3) cell.classList.add("difference-value");
      cell.textContent = value;
      precipitationRow.appendChild(cell);
    });
    precipitationBody.appendChild(precipitationRow);
  });
}

function buildDailyTable(observations) {
  const body = document.querySelector("#daily-table-body");
  body.innerHTML = "";

  observations.forEach(item => {
    const tr = document.createElement("tr");
    const dateCell = document.createElement("th");
    dateCell.scope = "row";
    dateCell.textContent = new Date(`${item.date}T12:00:00`).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );

    const tempCell = document.createElement("td");
    tempCell.textContent = item.maxTemp === null ? "Missing" : item.maxTemp.toFixed(1);

    const precipCell = document.createElement("td");
    precipCell.textContent = item.precipitation === null ? "Missing" : item.precipitation.toFixed(2);

    tr.append(dateCell, tempCell, precipCell);
    body.appendChild(tr);
  });
}

function buildSummary(summary) {
  const summer = summary.filter(row => ["06", "07", "08"].includes(row.key));
  const tempDifference = summer.reduce(
    (total, row) => total + (row.observedMax - row.normalMax), 0
  ) / summer.length;
  const observedRain = summer.reduce((total, row) => total + row.observedPrecip, 0);
  const normalRain = summer.reduce((total, row) => total + row.normalPrecip, 0);
  const rainDifference = observedRain - normalRain;

  document.querySelector("#season-summary").innerHTML = `
    <strong>Summer comparison (June–August):</strong>
    The 2024 average daily high was
    <strong>${Math.abs(tempDifference).toFixed(1)}°F ${tempDifference >= 0 ? "above" : "below"} normal</strong>.
    Total precipitation was
    <strong>${Math.abs(rainDifference).toFixed(2)} inches ${rainDifference >= 0 ? "above" : "below"} normal</strong>.
  `;
}


function buildChart(observations) {
  const container = document.querySelector("#weather-chart");
  if (!container) {
    throw new Error("The chart container was not found.");
  }

  const showTemperature = document.querySelector("#show-temperature");
  const showPrecipitation = document.querySelector("#show-precipitation");

  function draw() {
    const width = Math.max(container.clientWidth || 720, 320);
    const height = 360;
    const margin = { top: 22, right: 54, bottom: 48, left: 54 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const temperatures = observations
      .map(item => item.maxTemp)
      .filter(value => value !== null);
    const precipitation = observations
      .map(item => item.precipitation)
      .filter(value => value !== null);

    const tempMin = Math.floor((Math.min(...temperatures) - 5) / 5) * 5;
    const tempMax = Math.ceil((Math.max(...temperatures) + 5) / 5) * 5;
    const precipMax = Math.max(1, Math.ceil(Math.max(...precipitation) * 4) / 4);

    const x = index =>
      margin.left + (index / Math.max(observations.length - 1, 1)) * plotWidth;
    const yTemp = value =>
      margin.top + ((tempMax - value) / (tempMax - tempMin)) * plotHeight;
    const yPrecip = value =>
      margin.top + plotHeight - (value / precipMax) * plotHeight;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute(
      "aria-label",
      "Daily maximum temperature and precipitation for Corvallis from April through September 2024."
    );

    function add(tag, attrs = {}, text = "") {
      const el = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      if (text) el.textContent = text;
      svg.appendChild(el);
      return el;
    }

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--ink").trim() || "#183028";
    const muted = css.getPropertyValue("--muted").trim() || "#53645e";
    const border = css.getPropertyValue("--border").trim() || "#c8d5ce";
    const accent = css.getPropertyValue("--accent").trim() || "#2f6f4e";

    for (let i = 0; i <= 5; i++) {
      const value = tempMin + ((tempMax - tempMin) * i) / 5;
      const y = yTemp(value);
      add("line", {
        x1: margin.left,
        y1: y,
        x2: width - margin.right,
        y2: y,
        stroke: border,
        "stroke-width": 1
      });
      add("text", {
        x: margin.left - 8,
        y: y + 4,
        "text-anchor": "end",
        fill: muted,
        "font-size": 12
      }, `${Math.round(value)}°`);
    }

    const monthStarts = observations
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => index === 0 || item.date.slice(5, 7) !== observations[index - 1].date.slice(5, 7));

    monthStarts.forEach(({ item, index }) => {
      const date = new Date(`${item.date}T12:00:00`);
      add("text", {
        x: x(index),
        y: height - 18,
        "text-anchor": index === 0 ? "start" : "middle",
        fill: muted,
        "font-size": 12
      }, date.toLocaleDateString("en-US", { month: "short" }));
    });

    add("text", {
      x: 16,
      y: height / 2,
      transform: `rotate(-90 16 ${height / 2})`,
      "text-anchor": "middle",
      fill: ink,
      "font-size": 12
    }, "Daily high temperature (°F)");

    add("text", {
      x: width - 10,
      y: height / 2,
      transform: `rotate(90 ${width - 10} ${height / 2})`,
      "text-anchor": "middle",
      fill: ink,
      "font-size": 12
    }, "Daily precipitation (inches)");

    if (showPrecipitation.checked) {
      const barWidth = Math.max(1, plotWidth / observations.length - 0.5);
      observations.forEach((item, index) => {
        if (item.precipitation === null || item.precipitation <= 0) return;
        const top = yPrecip(item.precipitation);
        add("rect", {
          x: x(index) - barWidth / 2,
          y: top,
          width: barWidth,
          height: margin.top + plotHeight - top,
          fill: muted,
          opacity: 0.5
        });
      });
    }

    if (showTemperature.checked) {
      const points = observations
        .map((item, index) =>
          item.maxTemp === null ? null : `${x(index)},${yTemp(item.maxTemp)}`
        )
        .filter(Boolean)
        .join(" ");

      add("polyline", {
        points,
        fill: "none",
        stroke: accent,
        "stroke-width": 2.5,
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      });
    }

    const legendY = 14;
    add("line", {
      x1: margin.left,
      y1: legendY,
      x2: margin.left + 24,
      y2: legendY,
      stroke: accent,
      "stroke-width": 3
    });
    add("text", {
      x: margin.left + 30,
      y: legendY + 4,
      fill: ink,
      "font-size": 12
    }, "Daily high temperature");

    add("rect", {
      x: margin.left + 185,
      y: legendY - 6,
      width: 16,
      height: 10,
      fill: muted,
      opacity: 0.5
    });
    add("text", {
      x: margin.left + 207,
      y: legendY + 4,
      fill: ink,
      "font-size": 12
    }, "Daily precipitation");

    container.replaceChildren(svg);
  }

  showTemperature.addEventListener("change", draw);
  showPrecipitation.addEventListener("change", draw);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 120);
  });

  draw();
}

function setStatus(message, isError = false) {
  const status = document.querySelector("#data-status");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function setupTableToggle() {
  const button = document.querySelector("#toggle-daily-table");
  const region = document.querySelector("#daily-table-wrap");

  button.addEventListener("click", () => {
    const opening = region.hidden;
    region.hidden = !opening;
    button.setAttribute("aria-expanded", String(opening));
    button.textContent = opening ? "Hide daily data table" : "View daily data table";
  });
}

function setupQuiz() {
  document.querySelectorAll(".check-answer").forEach(button => {
    button.addEventListener("click", () => {
      const fieldset = button.closest(".question");
      const id = fieldset.dataset.question;
      const selected = new Set(
        [...fieldset.querySelectorAll("input:checked")].map(input => input.value)
      );
      const expected = quizKey[id];
      const correct =
        selected.size === expected.size &&
        [...expected].every(value => selected.has(value));

      const feedback = fieldset.querySelector(".feedback");
      feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;

      if (correct) {
        completed.add(id);
        feedback.textContent = quizFeedback[id];
      } else {
        completed.delete(id);
        feedback.textContent = selected.size
          ? "Not quite. Recheck both data panels and try again."
          : "Select at least one answer before checking.";
      }

      document.querySelector("#progress").textContent =
        `${completed.size} of 4 notebook questions completed.`;
    });
  });

  document.querySelector("#reset-quiz").addEventListener("click", () => {
    document.querySelector("#quiz").reset();
    completed.clear();
    document.querySelectorAll(".feedback").forEach(feedback => {
      feedback.textContent = "";
      feedback.className = "feedback";
    });
    document.querySelector("#progress").textContent =
      "0 of 4 notebook questions completed.";
    document.querySelector("#notebook-heading").focus();
  });
}

function initialize() {
  setupTableToggle();
  setupQuiz();

  try {
    buildDailyTable(OBSERVATIONS);
    buildComparisonTable(MONTHLY_COMPARISON);
    buildSummary(MONTHLY_COMPARISON);
    buildChart(OBSERVATIONS);
    setStatus(`Ready: ${OBSERVATIONS.length} verified daily observations from ${STATION_NAME}.`);
  } catch (error) {
    console.error(error);
    setStatus(
      "The chart could not be displayed. The complete weather and climate values remain available in the data tables.",
      true
    );
  }
}

document.addEventListener("DOMContentLoaded", initialize);
