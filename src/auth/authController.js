import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

const JWT_SECRET = 'segredo_academico';

export async function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Os campos email e senha são obrigatórios.' });
    }

    const [linhas] = await pool.execute(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
    );

    if (linhas.length === 0) {
        return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    const usuario = linhas[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
        return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    const token = jwt.sign(
        { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({ token });
}
