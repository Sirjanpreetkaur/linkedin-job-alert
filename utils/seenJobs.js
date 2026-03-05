const fs = require("fs");

const FILE_PATH = "./seenJobs.json";

function loadJobs() {
  try {
    const data = fs.readFileSync(FILE_PATH);
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function saveJobs(jobs) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([...jobs], null, 2));
}

let seenJobs = loadJobs();

function isNewJob(jobId) {

  if (seenJobs.has(jobId)) {
    return false;
  }

  seenJobs.add(jobId);
  saveJobs(seenJobs);

  return true;
}

module.exports = { isNewJob };