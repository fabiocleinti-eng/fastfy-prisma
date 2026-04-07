# Etapa 4 — Autorização por Papel de Usuário

## Objetivo

Implementar controle de acesso baseado em papéis (RBAC — Role-Based Access Control). Usuários regulares podem criar, visualizar e atualizar contatos. Apenas administradores podem excluir contatos.

---

## Alteração no banco de dados

```sql
ALTER TABLE usuarios ADD COLUMN papel ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario';
```

**`ENUM('admin', 'usuario')`** — restringe os valores possíveis diretamente no banco. Nenhum código consegue salvar um papel inválido, independentemente de qualquer validação no servidor.

**`DEFAULT 'usuario'`** — todo novo cadastro é regular por padrão. Para promover alguém a admin, é necessário atualizar diretamente no banco:

```sql
UPDATE usuarios SET papel = 'admin' WHERE id = 1;
```

Isso é intencional: a promoção a admin é uma operação administrativa, não um fluxo de cadastro normal.

---

## `papel` no payload do JWT — `src/auth/authController.js`

```js
const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    JWT_SECRET,
    { expiresIn: '8h' }
);
```

O `papel` agora viaja dentro do token. Isso permite que o middleware leia o papel de `req.usuario.papel` sem consultar o banco a cada requisição — o token já carrega essa informação de forma segura (assinada).

---

## Middleware `autorizarAdmin` — `src/auth/authMiddleware.js`

```js
export function autorizarAdmin(req, res, next) {
    if (req.usuario.papel !== 'admin') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    next();
}
```

### Por que é um middleware separado do `autenticar`?

Seguem responsabilidades distintas:

| Middleware | Pergunta que responde |
|---|---|
| `autenticar` | *Quem é você?* (identidade) |
| `autorizarAdmin` | *Você tem permissão para isso?* (autorização) |

Separados, podem ser combinados livremente. Uma rota pode exigir só autenticação; outra exige autenticação + papel admin. Se estivessem juntos, não haveria essa flexibilidade.

### HTTP 403 vs 401

| Código | Significado |
|---|---|
| `401 Unauthorized` | Não identificado — token ausente ou inválido |
| `403 Forbidden` | Identificado, mas sem permissão |

São situações distintas. Um usuário regular autenticado que tenta excluir um contato está identificado (401 não faz sentido), mas não tem permissão (403 é o código correto).

---

## Proteção das rotas — `src/contatos/contatosRouter.js`

```js
router.get('/',      autenticar,                   listarContatos);
router.get('/:id',   autenticar,                   buscarContato);
router.post('/',     autenticar,                   cadastrarContato);
router.put('/:id',   autenticar,                   atualizarContato);
router.delete('/:id', autenticar, autorizarAdmin,  excluirContato);
```

O Express executa os handlers em sequência. No DELETE:

```
autenticar → autorizarAdmin → excluirContato
```

Se `autenticar` recusar (token inválido) → para com 401, os seguintes não são chamados.
Se `autorizarAdmin` recusar (não é admin) → para com 403, o controller não é chamado.
Só se ambos chamarem `next()` o `excluirContato` é executado.

---

## Tabela de permissões ao fim desta etapa

| Operação | Sem token | Usuário regular | Admin |
|---|---|---|---|
| `GET /contatos` | 401 | ✓ | ✓ |
| `GET /contatos/:id` | 401 | ✓ | ✓ |
| `POST /contatos` | 401 | ✓ | ✓ |
| `PUT /contatos/:id` | 401 | ✓ | ✓ |
| `DELETE /contatos/:id` | 401 | 403 | ✓ |
