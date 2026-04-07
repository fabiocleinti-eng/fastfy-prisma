import bcrypt from 'bcrypt';
import pool from '../db/connection.js';

export async function cadastrarUsuario(req, res) {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Os campos nome, email e senha são obrigatórios.' });
    }

    const [existente] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
    );

    if (existente.length > 0) {
        return res.status(409).json({ erro: 'Já existe um usuário com esse email.' });
    }

    const hash = await bcrypt.hash(senha, 10);

    const [resultado] = await pool.execute(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, hash]
    );

    res.status(201).json({ id: resultado.insertId, nome, email });
}
