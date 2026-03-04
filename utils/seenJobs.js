const seenJobs = new Set();

function isNewJob(jobId) {
  if (seenJobs.has(jobId)) {
    return false;
  }

  seenJobs.add(jobId);
  return true;
}

module.exports = { isNewJob };