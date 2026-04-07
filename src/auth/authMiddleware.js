import jwt from 'jsonwebtoken';

const JWT_SECRET = 'segredo_academico';

export function autenticar(req, res, next) {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ erro: 'Token não informado.' });
    }

    const [, token] = authorization.split(' ');

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.usuario = payload;
        next();
    } catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

export function autorizarAdmin(req, res, next) {
    if (req.usuario.papel !== 'admin') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    next();
}
