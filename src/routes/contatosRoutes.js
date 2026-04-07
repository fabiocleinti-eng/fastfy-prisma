import contatosController from '../controllers/ContatosController.js';
import { verifyJwt } from '../middlewares/authMiddleware.js';

const paramsIdSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string', pattern: '^[1-9][0-9]*$' }
    }
};

const contatoBodySchema = {
    type: 'object',
    required: ['nome'],
    additionalProperties: false,
    properties: {
        nome: { type: 'string', minLength: 2, maxLength: 120 },
        telefone: { type: 'string', minLength: 8, maxLength: 30 },
        email: { type: 'string', format: 'email' }
    },
    anyOf: [
        { required: ['telefone'] },
        { required: ['email'] }
    ]
};

async function contatosRoutes(app) {
    app.get('/contatos', {
        preHandler: [verifyJwt],
        handler: contatosController.listar
    });

    app.get('/contatos/:id', {
        preHandler: [verifyJwt],
        schema: {
            tags: ['Contatos'],
            params: paramsIdSchema
        },
        handler: contatosController.buscarPorId
    });

    app.post('/contatos', {
        preHandler: [verifyJwt],
        schema: {
            tags: ['Contatos'],
            body: contatoBodySchema
        },
        handler: contatosController.cadastrar
    });

    app.put('/contatos/:id', {
        preHandler: [verifyJwt],
        schema: {
            tags: ['Contatos'],
            params: paramsIdSchema,
            body: contatoBodySchema
        },
        handler: contatosController.atualizar
    });

    app.delete('/contatos/:id', {
        preHandler: [verifyJwt],
        schema: {
            tags: ['Contatos'],
            params: paramsIdSchema
        },
        handler: async (request, reply) => {
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ erro: 'Acesso restrito a administradores.' });
            }

            return contatosController.excluir(request, reply);
        }
    });
}

export default contatosRoutes;
