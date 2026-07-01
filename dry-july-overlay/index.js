const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

const DRY_JULY_URL = "https://www.dryjuly.com/users/ashtin-james";
const TARGET = 150000;

let latestData = {
  name: "Ashtin James",
  raised: 0,
  target: TARGET,
  percent: 0,
  donations: [],
  updated: "Starting..."
};

app.use(express.static("public"));

function moneyToNumber(value) {
  return Number(String(value).replace(/[$,]/g, ""));
}

async function updateDryJulyData() {
  try {
    const { data } = await axios.get(DRY_JULY_URL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(data);

    const name = $("h1").first().text().trim() || "Ashtin James";

    const raisedText = $("h4")
      .filter((i, el) => $(el).text().trim().toLowerCase() === "raised")
      .next("h3")
      .text()
      .trim();

    const raised = raisedText ? moneyToNumber(raisedText) : 0;
    const target = TARGET;
    const percent = (raised / target) * 100;

    const donations = [];

    $("h2").each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      const match = text.match(/\$([\d,]+(?:\.\d{2})?)\s+from\s+(.+)/i);

      if (match) {
        donations.push({
          amount: "$" + match[1],
          name: match[2].trim()
        });
      }
    });

    latestData = {
      name,
      raised,
      target,
      percent,
      donations: donations.slice(0, 3),
      updated: new Date().toLocaleTimeString()
    };

    console.log(`Updated Dry July: $${raised} / $${target}`);
    console.log("Last 3 donors:", latestData.donations);
  } catch (err) {
    console.log("Could not update Dry July data:", err.message);
  }
}

app.get("/api/dryjuly", (req, res) => {
  res.json(latestData);
});

updateDryJulyData();
setInterval(updateDryJulyData, 30000);

app.listen(PORT, () => {
  console.log(`Overlay running here: http://localhost:${PORT}/overlay.html`);
});