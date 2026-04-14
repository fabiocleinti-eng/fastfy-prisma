import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRepositoryPrisma } from "../repositories/user.repository.js";

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const email = request.headers['email'] as string;
    if (!email) {
        return reply.status(401).send({ message: 'Email header is required' });
    }

    const userRepository = new UserRepositoryPrisma();
    const user = await userRepository.findbyEmail(email);

    if (!user) {
        return reply.status(401).send({ message: 'User not found' });
    }
}
