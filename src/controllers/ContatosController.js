import contatosRepository from '../repositories/ContatosRepository.js';

class ContatosController {
    async cadastrar(request, reply) {
        const { nome, telefone, email } = request.body;
        const userId = Number(request.user.sub);

        const contato = await contatosRepository.create({
            nome,
            telefone,
            email,
            userId
        });

        return reply.code(201).send(contato);
    }

    async listar(_request, reply) {
        const contatos = await contatosRepository.findAll();
        return reply.send(contatos);
    }

    async buscarPorId(request, reply) {
        const { id } = request.params;
        const contato = await contatosRepository.findById(Number(id));

        if (!contato) {
            return reply.code(404).send({ erro: 'Contato nao encontrado.' });
        }

        return reply.send(contato);
    }

    async atualizar(request, reply) {
        const { id } = request.params;
        const { nome, telefone, email } = request.body;

        const existente = await contatosRepository.findById(Number(id));
        if (!existente) {
            return reply.code(404).send({ erro: 'Contato nao encontrado.' });
        }

        const contato = await contatosRepository.update(Number(id), {
            nome,
            telefone,
            email
        });

        return reply.send(contato);
    }

    async excluir(request, reply) {
        const { id } = request.params;
        const existente = await contatosRepository.findById(Number(id));

        if (!existente) {
            return reply.code(404).send({ erro: 'Contato nao encontrado.' });
        }

        await contatosRepository.delete(Number(id));
        return reply.code(204).send();
    }
}

export default new ContatosController();
