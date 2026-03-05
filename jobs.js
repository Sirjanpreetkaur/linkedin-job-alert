require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { sendTelegramMessage } = require("./telegram");
const { isNewJob } = require("./utils/seenJobs");

const KEYWORDS = (process.env.JOB_KEYWORDS || "react developer").split(",");

const LOCATION = "Delhi NCR";
const RADIUS = 50;

// check first 3 pages (75 jobs)
const START_POSITIONS = [0, 25, 50];

async function fetchJobs() {

  console.log("\n==============================");
  console.log("Checking LinkedIn jobs");
  console.log("Time:", new Date().toLocaleString());
  console.log("==============================\n");

  try {

    for (const keyword of KEYWORDS) {

      console.log("\nSearching keyword:", keyword);

      for (const start of START_POSITIONS) {

        const url =
          `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword.trim())}&location=India&geoId=102713980&distance=50&f_TPR=r86400&sortBy=DD&start=${start}`;
        console.log("\nRequest URL:", url);

        const response = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const html = response.data;

        const $ = cheerio.load(html);

        const jobCards = $(".base-card");

        console.log("Jobs fetched:", jobCards.length);

        if (jobCards.length === 0) {
          console.log("No jobs returned from this page");
          continue;
        }

        jobCards.each(async (i, el) => {

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

          const postedTime = $(el)
            .find(".job-search-card__listdate")
            .text()
            .trim();

          console.log("\n----------------------");
          console.log("Job:", title);
          console.log("Company:", company);
          console.log("Posted:", postedTime);
          console.log("----------------------");

          if (jobId && isNewJob(jobId)) {

            const message = `
🚀 New LinkedIn Job

💼 ${title}
🏢 ${company}

📍 ${LOCATION}
🔎 ${keyword}

🕒 Posted: ${postedTime}

🔗 ${link}
`;

            try {

              await sendTelegramMessage(message);
              console.log("📩 Telegram alert sent");

            } catch (err) {

              console.log("Telegram error:", err.message);

            }

          } else {

            console.log("Duplicate job skipped");

          }

        });

      }

    }

  } catch (error) {

    console.error("Job fetch error:", error.message);

  }

}

module.exports = { fetchJobs };