import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_BASE_URL, {
            transports: ['polling', 'websocket'],
            withCredentials: true,
            extraHeaders: {
                token
            }
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err.message);
        });
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    return socket
}

export const getSocket = (): Socket | null => socket;