const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ actor, action, entityType = '', entityId = '', details = {} }) => {
  return ActivityLog.create({
    actorId: actor?._id,
    actorRole: actor?.role || '',
    action,
    entityType,
    entityId: entityId ? entityId.toString() : '',
    details,
  });
};

module.exports = {
  logActivity,
};
