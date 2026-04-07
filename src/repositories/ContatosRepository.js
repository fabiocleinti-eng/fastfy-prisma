import prisma from '../lib/prisma.js';

class ContatosRepository {
    async create({ nome, telefone, email, userId }) {
        return prisma.contact.create({
            data: {
                nome,
                telefone: telefone || null,
                email: email || null,
                userId
            }
        });
    }

    async findAll() {
        return prisma.contact.findMany({
            orderBy: { id: 'desc' }
        });
    }

    async findById(id) {
        return prisma.contact.findUnique({
            where: { id }
        });
    }

    async update(id, { nome, telefone, email }) {
        return prisma.contact.update({
            where: { id },
            data: {
                nome,
                telefone: telefone || null,
                email: email || null
            }
        });
    }

    async delete(id) {
        return prisma.contact.delete({
            where: { id }
        });
    }
}

export default new ContatosRepository();
