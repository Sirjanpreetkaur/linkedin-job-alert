require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { sendTelegramMessage } = require("./telegram");
const { isNewJob } = require("./utils/seenJobs");

const KEYWORDS = process.env.JOB_KEYWORDS.split(",");

const LOCATION = "Delhi NCR";
const RADIUS = 50;

const MAX_JOB_AGE_HOURS = 24;

// only send "no jobs" once per hour
let lastNoJobMessageTime = 0;

function isRecentJob(dateString) {
  if (!dateString) return false;

  const postedDate = new Date(dateString);
  const now = new Date();

  const diffHours = (now - postedDate) / (1000 * 60 * 60);

  return diffHours <= MAX_JOB_AGE_HOURS;
}

async function fetchJobs() {

  console.log("Checking LinkedIn jobs...");

  let newJobsFound = false;

  try {

    for (const keyword of KEYWORDS) {

      const url =
        `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword.trim())}&location=${encodeURIComponent(LOCATION)}&distance=${RADIUS}&f_E=1%2C2%2C3&sortBy=DD`;

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

📍 ${LOCATION}
🔎 ${keyword}

🕒 Posted: ${postedDate}

🔗 ${link}
`;

          await sendTelegramMessage(message);

          console.log("New job:", title);

        }

      });

    }

    const now = Date.now();

    if (!newJobsFound && now - lastNoJobMessageTime > 3600000) {

      await sendTelegramMessage(`
ℹ️ Job Bot Update

No new jobs found in the last hour.

Still monitoring LinkedIn every 5 minutes.
`);

      lastNoJobMessageTime = now;

      console.log("No jobs found (hourly message sent)");

    }

  } catch (error) {

    console.error("Job fetch error:", error.message);

  }

}

module.exports = { fetchJobs };