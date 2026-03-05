require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { sendTelegramMessage } = require("./telegram");
const { isNewJob } = require("./utils/seenJobs");

const KEYWORDS = (process.env.JOB_KEYWORDS || "react developer").split(",");

// Preferred locations
const LOCATIONS = [
  "Gurugram",
  "Gurgaon",
  "Noida",
  "Delhi",
  "Delhi NCR"
];

// Radius in KM
const RADIUS = 50;

// Pagination (75 jobs)
const START_POSITIONS = [0, 25, 50];

// Only allow relevant titles
const TITLE_FILTERS = [
  "react developer",
  "react js developer",
  "frontend developer",
  "frontend web developer",
  "ui developer",
  "ui engineer",
  "next js developer",
  "software engineer frontend",
  "frontend",
  "front end",
  "react",
  "javascript",
  "ui developer",
  "web developer",
  "software engineer"
];

async function fetchJobs() {

  console.log("\n==============================");
  console.log("Checking LinkedIn jobs");
  console.log("Time:", new Date().toLocaleString());
  console.log("==============================\n");

  try {

    for (const keyword of KEYWORDS) {

      console.log("\nSearching keyword:", keyword);

      for (const location of LOCATIONS) {

        console.log("\nLocation:", location);

        for (const start of START_POSITIONS) {

          const url =
            `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword.trim())}&location=${encodeURIComponent(location)}&distance=${RADIUS}&f_TPR=r86400&sortBy=DD&start=${start}`;

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

            // Filter relevant job titles
            const lowerTitle = title.toLowerCase();

            const relevant = TITLE_FILTERS.some(word =>
              lowerTitle.includes(word)
            );

            if (!relevant) {
              console.log("Skipping irrelevant job:", title);
              return;
            }

            // Use job link as unique ID
            const jobId = link;

            if (jobId && isNewJob(jobId)) {

              const message = `
🚀 New Frontend Job

💼 ${title}
🏢 ${company}

📍 ${location}
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

    }

  } catch (error) {

    console.error("Job fetch error:", error.message);

  }

}

module.exports = { fetchJobs };