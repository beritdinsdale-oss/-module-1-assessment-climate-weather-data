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
  const body = document.querySelector("#comparison-body");
  body.innerHTML = "";

  summary.forEach(row => {
    const tr = document.createElement("tr");
    const values = [
      row.month,
      row.observedMax === null ? "Missing" : `${row.observedMax.toFixed(1)}°F`,
      `${row.normalMax.toFixed(1)}°F`,
      signed(row.observedMax === null ? null : row.observedMax - row.normalMax, 1, "°F"),
      row.observedPrecip === null ? "Missing" : `${row.observedPrecip.toFixed(2)} in`,
      `${row.normalPrecip.toFixed(2)} in`,
      signed(row.observedPrecip === null ? null : row.observedPrecip - row.normalPrecip, 2, " in")
    ];

    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = value;
      if (index === 3 || index === 6) {
        cell.classList.add("difference-value");
      }
      tr.appendChild(cell);
    });
    body.appendChild(tr);
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
  const canvas = document.querySelector("#weather-chart");
  if (!canvas || typeof Chart === "undefined") {
    throw new Error("The chart library did not load.");
  }

  const labels = observations.map(item => item.date);
  const temperatures = observations.map(item => item.maxTemp);
  const precipitation = observations.map(item => item.precipitation);

  weatherChart = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: "line",
          label: "Daily high temperature (°F)",
          data: temperatures,
          yAxisID: "temperature",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          spanGaps: false,
          tension: 0.12
        },
        {
          type: "bar",
          label: "Daily precipitation (inches)",
          data: precipitation,
          yAxisID: "precipitation",
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      parsing: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            title(items) {
              if (!items.length) return "";
              const date = new Date(`${labels[items[0].dataIndex]}T12:00:00`);
              return date.toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric"
              });
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 7,
            callback(value, index) {
              const date = new Date(`${labels[index]}T12:00:00`);
              return date.toLocaleDateString("en-US", { month: "short" });
            }
          },
          title: { display: true, text: "Date" }
        },
        temperature: {
          position: "left",
          title: { display: true, text: "Daily high temperature (°F)" }
        },
        precipitation: {
          position: "right",
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Daily precipitation (inches)" }
        }
      }
    }
  });

  document.querySelector("#show-temperature").addEventListener("change", event => {
    weatherChart.setDatasetVisibility(0, event.target.checked);
    weatherChart.update();
  });

  document.querySelector("#show-precipitation").addEventListener("change", event => {
    weatherChart.setDatasetVisibility(1, event.target.checked);
    weatherChart.update();
  });
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
