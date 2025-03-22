import { Server } from 'socket.io';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';

const io = new Server();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`user joined room: ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`user left room: ${room}`);
  });

  socket.on('task update', async (data) => {
    const { id, ...updateData } = data;
    await db.update(tasks).set(updateData).where(tasks.id.eq(id));
    io.to(data.room).emit('task updated', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

export const GET = async () => {
  return new Response('WebSocket server is running');
};
