import authController from '../controllers/AuthController.js';

const registerBodySchema = {
    type: 'object',
    required: ['nome', 'email', 'senha'],
    additionalProperties: false,
    properties: {
        nome: { type: 'string', minLength: 2, maxLength: 120 },
        email: { type: 'string', format: 'email' },
        senha: { type: 'string', minLength: 6, maxLength: 128 }
    }
};

const loginBodySchema = {
    type: 'object',
    required: ['email', 'senha'],
    additionalProperties: false,
    properties: {
        email: { type: 'string', format: 'email' },
        senha: { type: 'string', minLength: 6, maxLength: 128 }
    }
};

async function authRoutes(app) {
    app.post('/auth/register', {
        schema: {
            tags: ['Auth'],
            body: registerBodySchema
        },
        handler: authController.register
    });

    app.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            body: loginBodySchema
        },
        handler: authController.login
    });
}

export default authRoutes;
