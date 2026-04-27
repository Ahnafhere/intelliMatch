const appendTimelineEvent = (application, stage, note = '') => {
  if (!application.timeline) application.timeline = [];
  application.timeline.push({
    stage,
    note,
    changedAt: new Date(),
  });
};

const mapStatusToStage = (status) => {
  if (status === 'Pending') return 'Applied';
  if (status === 'Shortlisted') return 'Shortlisted';
  if (status === 'Selected') return 'Final Decision';
  if (status === 'Rejected') return 'Final Decision';
  return status;
};

module.exports = {
  appendTimelineEvent,
  mapStatusToStage,
};
