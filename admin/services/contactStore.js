const fs = require("fs");
const path = require("path");

const contactMessagesPath = path.join(__dirname, "..", "..", "data", "contactMessages.json");

function readMessages() {
  if (!fs.existsSync(contactMessagesPath)) return [];
  const raw = fs.readFileSync(contactMessagesPath, "utf8");
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [];
}

function writeMessages(messages) {
  fs.mkdirSync(path.dirname(contactMessagesPath), { recursive: true });
  fs.writeFileSync(contactMessagesPath, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
}

function addMessage(message) {
  const existing = readMessages();
  const next = [
    {
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      ...message,
      createdAt: new Date().toISOString()
    },
    ...existing
  ];
  writeMessages(next);
  return next[0];
}

module.exports = {
  readMessages,
  addMessage
};
