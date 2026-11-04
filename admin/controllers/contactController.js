const { readMessages } = require("../services/contactStore");

function listMessages(req, res) {
  const messages = readMessages();
  return res.json({ data: messages });
}

module.exports = {
  listMessages
};
