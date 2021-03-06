const fs = require('fs');
const { NODE_ENV, PORT, SCROBBLERBOT_TOKEN } = require('./config');
// const { sendToAdmin } = require('./src/helpers/utils');
const bot = require('./src/bot');


if (NODE_ENV === 'production') {
  bot.startWebhook(`/${SCROBBLERBOT_TOKEN}`, null, PORT);
} else if (NODE_ENV === 'development') {
  // const tlsOptions = {
  //   key: fs.readFileSync('server.pem'),
  //   cert: fs.readFileSync('server.pem'),
  // };

  bot.startWebhook(`/${SCROBBLERBOT_TOKEN}`, null, PORT);
}

console.log(`Server is listening to localhost:${PORT}`);

// process.on('unhandledRejection', (e) => {
//   console.log(e);
//   sendToAdmin(`Unhandled Rejection! ${e.message}`);
// });

// process.on('uncaughtException', (e) => {
//   console.log(e);
//   sendToAdmin(`Uncaught Exception! ${e.message}`);
// });
