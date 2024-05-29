const express = require('express');
const ChatCtrl = require('./chat.controller');

const router = express.Router();

// router.route('/').get(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.getRecentConversation);
//router.route('/initiate').post(ChatCtrl.initiate);
// router.route('/conversation').get(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.getRecentConversation);
// router.route('/:roomId').get(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.getConversationByRoomId);
//router.route('/message').post(ChatCtrl.postCoordinates);
// router.route('/:roomId/mark-read').put(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.markConversationReadByRoomId);

// router.route('/room/:roomId').delete(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.deleteRoomById);
// router.route('/message/:messageId').delete(authRoles(ROLES.ADMIN, ROLES.PROVIDER), ChatCtrl.deleteMessageById);

module.exports = router;
