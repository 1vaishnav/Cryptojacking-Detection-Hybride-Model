const socket = io();
const totalScansEl = document.getElementById("totalScans");
const benignCountEl = document.getElementById("benignCount");
const cryptoCountEl = document.getElementById("cryptoCount");
const resultsBody = document.getElementById("resultsBody");

let totalScans = 0;
let benignCount = 0;
let cryptoCount = 0;

// CPU Chart
const ctx = document.getElementById("cpuChart").getContext("2d");
const cpuChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "CPU Usage (%)",
      data: [],
      borderColor: "#58a6ff",
      fill: false,
      tension: 0.1
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});

socket.on("newResult", (data) => {
  totalScans++;
  totalScansEl.textContent = totalScans;

  const verdictClass = data.finalVerdict === "crypto" ? "crypto" : "benign";
  if (data.finalVerdict === "crypto") cryptoCount++;
  else benignCount++;

  benignCountEl.textContent = benignCount;
  cryptoCountEl.textContent = cryptoCount;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td>${data.url}</td>
    <td class="${data.cpuVerdict}">${data.cpuVerdict}</td>
    <td class="${data.webVerdict}">${data.webVerdict}</td>
    <td class="${verdictClass}">${data.finalVerdict}</td>
  `;
  resultsBody.prepend(row);

  // Update CPU chart
  if (data.cpuUsage) {
    cpuChart.data.labels.push(new Date().toLocaleTimeString());
    cpuChart.data.datasets[0].data.push(data.cpuUsage);
    if (cpuChart.data.labels.length > 10) {
      cpuChart.data.labels.shift();
      cpuChart.data.datasets[0].data.shift();
    }
    cpuChart.update();
  }
});
