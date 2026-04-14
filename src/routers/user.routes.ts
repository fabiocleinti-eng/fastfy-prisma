import type { FastifyInstance } from 'fastify';
import { UserRepositoryPrisma } from '../repositories/user.repository.js';
import type { UserCreate } from '../interfaces/user.interface.js';
import { UserUseCase } from '../usecases/user.usecases.js';

export async function userRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepositoryPrisma();
    const userUseCase = new UserUseCase(userRepository);

    fastify.post<{ Body: UserCreate }>('/', async (request, reply) => {
        const { name, email } = request.body;
        try {
            const data = await userUseCase.create({
                name,
                email,
            });
            return reply.status(201).send(data);
        } catch (error) {
            reply.send(error);
        }
    });

    fastify.get('/email/:email', async (request, reply) => {
        return reply.send('Hello World');
    });

    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        return reply.send(`User with ID ${id} deleted`);
    });
}
