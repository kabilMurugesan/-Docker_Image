const connection = (client) => {
  let providers = [];

    client.on('join_route', (data) => {
       const { shared_route_id, user_id } = data; // Data sent from client when join_room event emitted
       client.join(shared_route_id); // Join the user to a socket room
       providers.push({
        socketId: client.id,
        user_id,
      });
      });
    
      client.on('send_coords', (data) => {
        const shared_route_id = data.route_details.shared_route_id;
        client.to(shared_route_id).emit('receive_coords', data);
      });

  client.on('route_completed', (shared_route_id) => {
    client.leave(shared_route_id);
  });
};
const emitSharedRoute = async (shared_route_id,data) => {
  global.io.to(shared_route_id).emit("updatedRoute",data)
}

module.exports = {
  connection,
  emitSharedRoute
};
