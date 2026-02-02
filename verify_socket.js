const io = require('socket.io-client');
const socket = io('http://localhost:3000');

console.log('Connecting to server...');

socket.on('connect', () => {
    console.log('Connected! ID:', socket.id);

    // Test Payload
    const payload = {
        pixels: [{ x: 50, y: 50 }],
        idolColor: '#ff0000',
        idolGroupName: 'TestGroup',
        nickname: 'Tester'
    };

    console.log('Emitting purchase_pixels...');
    socket.emit('purchase_pixels', payload);
});

socket.on('pixel_update', (data) => {
    console.log('SUCCESS: Received pixel_update:', data);
    process.exit(0);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

// Timeout
setTimeout(() => {
    console.error('TIMEOUT: No response received after 5 seconds.');
    process.exit(1);
}, 5000);
