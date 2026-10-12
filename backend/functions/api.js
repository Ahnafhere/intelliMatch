const serverless = require('serverless-http');
const { app } = require('../app');

const handler = serverless(app, { binary: ['application/pdf', 'multipart/form-data', 'application/octet-stream'] });

module.exports.handler = async (event, context) => {
  // Don't wait for the open MongoDB socket to close before returning
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};
