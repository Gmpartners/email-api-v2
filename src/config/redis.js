const Redis = require('redis');
require('dotenv').config();

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('Número máximo de tentativas de reconexão excedido');
            }
            return Math.min(retries * 100, 3000);
        },
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

module.exports = redisClient;
