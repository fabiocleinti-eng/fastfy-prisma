import { prisma } from "../database/prisma.client.js";
import type { User, UserCreate, userRepository} from '../interfaces/user.interface.js';

export class UserRepositoryPrisma implements userRepository {

    async create(data: UserCreate): Promise<User> {
        const result = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
            },
        });
        return result;
    }

    async findbyEmail(email: string): Promise<User | null> {
        const result = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        return result || null;
    }
}
