const fs = require("fs");

const FILE = "./seenJobs.json";

function loadSeenJobs() {
  try {
    const data = fs.readFileSync(FILE);
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function saveSeenJobs(seenJobs) {
  fs.writeFileSync(FILE, JSON.stringify([...seenJobs], null, 2));
}

let seenJobs = loadSeenJobs();

function isNewJob(jobLink) {

  if (seenJobs.has(jobLink)) {
    return false;
  }

  seenJobs.add(jobLink);

  saveSeenJobs(seenJobs);

  return true;
}

module.exports = { isNewJob };