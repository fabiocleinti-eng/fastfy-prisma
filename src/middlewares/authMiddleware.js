export async function verifyJwt(request, reply) {
    try {
        await request.jwtVerify();
    } catch {
        return reply.code(401).send({ erro: 'Token invalido ou expirado.' });
    }
}
