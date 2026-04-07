import prisma from '../lib/prisma.js';

class AuthRepository {
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    async createUser({ nome, email, senha, role }) {
        return prisma.user.create({
            data: { nome, email, senha, role },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
    }
}

export default new AuthRepository();
