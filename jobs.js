require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { sendTelegramMessage } = require("./telegram");
const { isNewJob } = require("./utils/seenJobs");

const KEYWORDS = process.env.JOB_KEYWORDS.split(",");

const LOCATIONS = [
  "Gurugram",
  "Gurgaon",
  "Noida",
  "Delhi NCR",
  "Delhi",
  "India"
];

const MAX_JOB_AGE_HOURS = 24;

// send "no jobs" message only once per hour
let lastNoJobMessageTime = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRecentJob(dateString) {
  if (!dateString) return false;

  const postedDate = new Date(dateString);
  const now = new Date();

  const diffHours = (now - postedDate) / (1000 * 60 * 60);

  return diffHours <= MAX_JOB_AGE_HOURS;
}

async function fetchJobs() {

  try {

    console.log("Checking LinkedIn jobs...");

    let newJobsFound = false;

    for (const keyword of KEYWORDS) {

      for (const location of LOCATIONS) {

        const url =
          `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword.trim())}&location=${encodeURIComponent(location)}&f_E=1%2C2%2C3&sortBy=DD`;

        try {

          const response = await axios.get(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
            }
          });

          const html = response.data;
          const $ = cheerio.load(html);

          $(".base-card").each(async (i, el) => {

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

            const postedDate =
              $(el)
                .find("time")
                .attr("datetime");

            if (!isRecentJob(postedDate)) return;

            if (jobId && isNewJob(jobId)) {

              newJobsFound = true;

              const message = `
🚀 Fresh LinkedIn Job

💼 ${title}
🏢 ${company}

📍 ${location}
🔎 ${keyword}

🕒 Posted: ${postedDate}

🔗 ${link}
`;

              await sendTelegramMessage(message);

              console.log("New job:", title);

            }

          });

        } catch (err) {

          if (err.response && err.response.status === 429) {

            console.log("LinkedIn rate limit hit. Waiting 60 seconds...");
            await sleep(60000);

          } else {

            console.log("Request error:", err.message);

          }

        }

        await sleep(4000);

      }

    }

    // send "no jobs" only once per hour
    const now = Date.now();

    if (!newJobsFound && now - lastNoJobMessageTime > 3600000) {

      await sendTelegramMessage(`
ℹ️ Job Bot Update

No new jobs found in the last hour.

Monitoring:
Gurugram
Gurgaon
Noida
Delhi NCR
Delhi
India
`);

      lastNoJobMessageTime = now;

      console.log("No new jobs found (hourly update sent).");

    }

  } catch (error) {

    console.error("Job fetch error:", error.message);

  }

}

module.exports = { fetchJobs };