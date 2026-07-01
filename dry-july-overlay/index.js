const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

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

    const response = await axios.get(DRY_JULY_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.google.com/"
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    const bodyText = $("body").text().replace(/\s+/g, " ");

    const name = $("h1").first().text().trim() || "Ashtin James";

    const moneyMatches = bodyText.match(/\$[\d,]+(?:\.\d{2})?/g) || [];

    let raised = 0;

    if (moneyMatches.length > 0) {
      raised = moneyToNumber(moneyMatches[0]);
    }

    const percent = (raised / TARGET) * 100;

    const donations = [];

    const donationRegex =
      /\$([\d,]+(?:\.\d{2})?)\s+from\s+(.+?)(?=\s+\$[\d,]+(?:\.\d{2})?\s+from|$)/gi;

    let match;

    while ((match = donationRegex.exec(bodyText)) !== null) {
      donations.push({
        amount: "$" + match[1],
        name: match[2].trim()
      });
    }

    latestData = {
      name,
      raised,
      target: TARGET,
      percent,
      donations: donations.slice(0, 3),
      updated: new Date().toLocaleTimeString()
    };

    console.log("==================================");
    console.log("Raised:", raised);
    console.log("Target:", TARGET);
    console.log("Percent:", percent.toFixed(2));
    console.log("Donations:", donations.slice(0, 3));
    console.log("==================================");

  } catch (err) {
    console.log("Could not update Dry July data:");
    console.log(err.response?.status || err.message);
  }
}

app.get("/api/dryjuly", (req, res) => {
  res.json(latestData);
});

updateDryJulyData();

setInterval(updateDryJulyData, 30000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Overlay: http://localhost:${PORT}/overlay.html`);
});
