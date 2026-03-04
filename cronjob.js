require("dotenv").config();
const cron = require("node-cron");
const { fetchJobs } = require("./jobs");

console.log("LinkedIn Job Bot Started...");

cron.schedule("*/5 * * * *", async () => {
  console.log("Running job check...");
  await fetchJobs();
});

// Run once immediately
fetchJobs();