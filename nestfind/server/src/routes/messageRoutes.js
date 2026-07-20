// nestfind/nestfind/server/src/routes/messageRoutes.js

const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversationController");
const { protect } = require("../middleware/auth");
const { messageLimiter } = require("../middleware/rateLimiter");
const { validateSendMessage } = require("../validators/tenantValidators");

router.get("/", protect, conversationController.getConversations);
router.post("/start", protect, conversationController.getOrCreateConversation);
router.get("/unread", protect, conversationController.getUnreadCount);
router.get("/:id/messages", protect, conversationController.getMessages);
router.post(
  "/:id/messages",
  protect,
  messageLimiter,
  validateSendMessage,
  conversationController.sendMessage,
);
router.get("/:id/search", protect, conversationController.searchMessages);
router.patch(
  "/:id/archive",
  protect,
  conversationController.archiveConversation,
);
router.delete("/:id", protect, conversationController.deleteConversation);

module.exports = router;
