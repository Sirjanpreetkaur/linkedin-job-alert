require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { sendTelegramMessage } = require("./telegram");
const { isNewJob } = require("./utils/seenJobs");

const KEYWORDS = (process.env.JOB_KEYWORDS || "react developer").split(",");

const LOCATION = "Delhi NCR";
const RADIUS = 50;
const MAX_HOURS = 24;

function hoursAgoFromText(text) {
  if (!text) return null;

  const t = text.toLowerCase().trim();

  if (t.includes("just now")) return 0;
  if (t.includes("today")) return 0;
  if (t.includes("yesterday")) return 24;

  const num = parseInt(t);

  if (t.includes("minute") || t.includes("min")) return num / 60;
  if (t.includes("hour") || t.includes("hr")) return num;
  if (t.includes("day")) return num * 24;

  return null;
}

function hoursAgoFromDatetime(datetime) {
  if (!datetime) return null;

  const posted = new Date(datetime);
  const now = new Date();

  const diff = (now - posted) / (1000 * 60 * 60);
  return diff;
}

async function fetchJobs() {

  console.log("\n===============================");
  console.log("Checking LinkedIn jobs");
  console.log("Time:", new Date().toLocaleString());
  console.log("===============================\n");

  try {

    for (const keyword of KEYWORDS) {

      console.log("Searching keyword:", keyword);
const url =
`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword.trim())}&location=${encodeURIComponent(LOCATION)}&distance=${RADIUS}&f_E=1%2C2%2C3&f_TPR=r86400&sortBy=DD`;
     
      console.log("URL:", url);

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      const html = response.data;

      const $ = cheerio.load(html);

      const jobs = $(".base-card");

      console.log("Jobs fetched:", jobs.length);

      jobs.each(async (i, el) => {

        const jobId = $(el).attr("data-entity-urn");

        const title = $(el)
          .find(".base-search-card__title")
          .text()
          .trim();

        const company = $(el)
          .find(".base-search-card__subtitle")
          .text()
          .trim();

        const link = $(el)
          .find(".base-card__full-link")
          .attr("href");

        const datetime = $(el).find("time").attr("datetime");

        const textTime = $(el)
          .find(".job-search-card__listdate")
          .text()
          .trim();

        let hoursAgo = hoursAgoFromDatetime(datetime);

        if (hoursAgo === null || isNaN(hoursAgo)) {
          hoursAgo = hoursAgoFromText(textTime);
        }

        console.log("\n----------------------------");
        console.log("Job:", title);
        console.log("Company:", company);
        console.log("Datetime:", datetime);
        console.log("Text time:", textTime);
        console.log("Hours ago:", hoursAgo);
        console.log("----------------------------");

        if (hoursAgo === null || hoursAgo > MAX_HOURS) {
          console.log("❌ Skipping (older than 24h)");
          return;
        }

        if (jobId && isNewJob(jobId)) {

          console.log("✅ New job within 24h");

          const message = `
🚀 LinkedIn Job (Last 24h)

💼 ${title}
🏢 ${company}

📍 ${LOCATION}
🔎 ${keyword}

🕒 Posted: ${textTime || datetime}

🔗 ${link}
`;

          try {
            await sendTelegramMessage(message);
            console.log("📩 Telegram sent");
          } catch (err) {
            console.log("Telegram error:", err.message);
          }

        } else {
          console.log("⚠️ Duplicate job skipped");
        }

      });

    }

  } catch (error) {

    console.error("Job fetch error:", error.message);

  }

}

module.exports = { fetchJobs };