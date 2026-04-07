import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import router from './router.js';

const app = Fastify({
    logger: true
});

await app.register(cors, {
    origin: true
});

await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me'
});

await app.register(router, {
    prefix: '/api'
});

export default app;