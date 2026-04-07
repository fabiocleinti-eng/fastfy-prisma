import pool from '../db/connection.js';

export async function cadastrarContato(req, res) {
    const { nome, telefone, email } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    if (!telefone && !email) {
        return res.status(400).json({ erro: 'Informe ao menos um telefone ou email.' });
    }

    const [resultado] = await pool.execute(
        'INSERT INTO contatos (nome, telefone, email) VALUES (?, ?, ?)',
        [nome, telefone ?? null, email ?? null]
    );

    res.status(201).json({ id: resultado.insertId, nome, telefone, email });
}

export async function listarContatos(_req, res) {
    const [contatos] = await pool.execute('SELECT * FROM contatos');

    res.json(contatos);
}
export async function buscarContato(req, res) {
    const { id } = req.params;

    const [linhas] = await pool.execute(
        'SELECT * FROM contatos WHERE id = ?',
        [id]
    );

    if (linhas.length === 0) {
        return res.status(404).json({ erro: 'Contato não encontrado.' });
    }

    res.json(linhas[0]);
}

export async function atualizarContato(req, res) {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    if (!telefone && !email) {
        return res.status(400).json({ erro: 'Informe ao menos um telefone ou email.' });
    }

    const [resultado] = await pool.execute(
        'UPDATE contatos SET nome = ?, telefone = ?, email = ? WHERE id = ?',
        [nome, telefone ?? null, email ?? null, id]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ erro: 'Contato não encontrado.' });
    }

    res.json({ id: Number(id), nome, telefone, email });
}

export async function excluirContato(req, res) {
    const { id } = req.params;

    const [resultado] = await pool.execute(
        'DELETE FROM contatos WHERE id = ?',
        [id]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ erro: 'Contato não encontrado.' });
    }

    res.status(204).send();
}
