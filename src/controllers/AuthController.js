import bcrypt from 'bcrypt';
import authRepository from '../repositories/AuthRepository.js';

class AuthController {
    async register(request, reply) {
        const { nome, email, senha } = request.body;

        const existingUser = await authRepository.findUserByEmail(email);
        if (existingUser) {
            return reply.code(409).send({ erro: 'Ja existe um usuario com esse email.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const user = await authRepository.createUser({
            nome,
            email,
            senha: senhaHash,
            role: 'user'
        });

        return reply.code(201).send(user);
    }

    async login(request, reply) {
        const { email, senha } = request.body;

        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            return reply.code(401).send({ erro: 'Email ou senha invalidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if (!senhaCorreta) {
            return reply.code(401).send({ erro: 'Email ou senha invalidos.' });
        }

        const token = await reply.jwtSign(
            {
                sub: String(user.id),
                email: user.email,
                nome: user.nome,
                role: user.role
            },
            { expiresIn: '8h' }
        );

        return reply.send({ token });
    }
}

export default new AuthController();
