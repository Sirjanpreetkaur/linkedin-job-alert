const fs = require("fs");

const FILE_PATH = "./seenJobs.json";

function loadSeenJobs() {
  try {
    const data = fs.readFileSync(FILE_PATH);
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function saveSeenJobs(seenJobs) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([...seenJobs], null, 2));
}

let seenJobs = loadSeenJobs();

function isNewJob(jobId) {

  if (seenJobs.has(jobId)) {
    return false;
  }

  seenJobs.add(jobId);
  saveSeenJobs(seenJobs);

  return true;
}

module.exports = { isNewJob };