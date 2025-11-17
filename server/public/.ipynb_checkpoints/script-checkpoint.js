const socket = io();
const totalScansEl = document.getElementById("totalScans");
const benignCountEl = document.getElementById("benignCount");
const cryptoCountEl = document.getElementById("cryptoCount");
const resultsBody = document.getElementById("resultsBody");
const lastSyncEl = document.getElementById("lastSync");

let totalScans = 0;
let benignCount = 0;
let cryptoCount = 0;

const ctx = document.getElementById("cpuChart").getContext("2d");
const cpuChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "CPU Usage (%)",
        data: [],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#a2abc6"
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)"
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: "#a2abc6"
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)"
        }
      }
    }
  }
});

const formatBadge = (verdict) => {
  const type = verdict === "crypto" ? "danger" : "success";
  return `<span class="badge ${type}">${verdict}</span>`;
};

socket.on("newResult", (data) => {
  totalScans += 1;
  totalScansEl.textContent = totalScans;

  if (data.finalVerdict === "crypto") {
    cryptoCount += 1;
  } else {
    benignCount += 1;
  }

  benignCountEl.textContent = benignCount;
  cryptoCountEl.textContent = cryptoCount;

  const now = new Date();
  if (lastSyncEl) {
    lastSyncEl.textContent = now.toLocaleTimeString();
  }

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${now.toLocaleTimeString()}</td>
    <td>${data.url}</td>
    <td>${formatBadge(data.cpuVerdict)}</td>
    <td>${formatBadge(data.webVerdict)}</td>
    <td>${formatBadge(data.finalVerdict)}</td>
  `;
  resultsBody.prepend(row);

  while (resultsBody.children.length > 20) {
    resultsBody.removeChild(resultsBody.lastElementChild);
  }

  if (typeof data.cpuUsage === "number") {
    cpuChart.data.labels.push(now.toLocaleTimeString());
    cpuChart.data.datasets[0].data.push(data.cpuUsage);

    if (cpuChart.data.labels.length > 15) {
      cpuChart.data.labels.shift();
      cpuChart.data.datasets[0].data.shift();
    }

    cpuChart.update();
  }
});
