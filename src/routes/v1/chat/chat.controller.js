


  //   global.io('connection', (socket) => {
  //     console.log(`User connected ${socket.id}`);
      
  //     socket.on('join_route', (data) => {
  //         console.log(data);
  //         const { route_id, user_id,latitude,logitude } = data; // Data sent from client when join_room event emitted
  //         socket.join(route_id); // Join the user to a socket room
  //           socket.to(route_id).emit('receive_coords', latitude,logitude);
  //           io.in(room).emit('receive_coords', data);
  //           socket.emit('receive_coords', latitude,logitude);
  //       });
      
  //       socket.on('send_coords', (data) => {
  //          const { route_id, user_id } = data;
  //          io.in(room).emit('receive_coords', data); // Send to all users in room, including sender
  //          //   .then((response) => console.log(response))
  //       //   //   .catch((err) => console.log(err));
  //       // });
  //   });
  // });

// const postCoordinates = async (req, res) => {
//   try {
//     const route_progress_id = req.body.route_progress_id;
//     const lat = req.body.latitude;
//     const long = req.body.longitude;

//     global.io.emit(route_progress_id, latitude,longitude);
//     //const chatRoomInfo = (post && post.chatRoomInfo) || [];
//     // if (post && chatRoomInfo && chatRoomInfo.length) {
//     //   chatRoomInfo.forEach((roomInfo) => {
//     //     if (roomInfo.userId !== post.postedByUser.userId) {
//     //       global.io.emit(roomInfo.userId, post);
//     //     }
//     //   });
//     // }
//     return res.status(200).json({ success: true, lat,long });
//   } catch (error) {
//     return res.status(500).json({ success: false, error });
//   }
// };

// module.exports = {
//   //CHAT_ROOM_TYPES,
//   initiate,
//   postCoordinates,
//   // getRecentConversation,
//   // getConversationByRoomId,
//   // deleteRoomById,
// };
