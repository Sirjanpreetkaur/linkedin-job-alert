require("dotenv").config();
const { fetchJobs } = require("./jobs");

console.log("=================================");
console.log("LinkedIn Job Bot Started");
console.log("Time:", new Date().toLocaleString());
console.log("=================================");

async function runBot() {
  try {
    console.log("Checking LinkedIn jobs...");
    await fetchJobs();
    console.log("Job check completed.");
  } catch (error) {
    console.error("Bot error:", error);
  }
}

runBot();