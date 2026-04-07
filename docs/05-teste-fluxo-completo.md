# Etapa 5 — Teste do Fluxo Completo

## Pré-requisitos

- Servidor rodando (`npm run dev`)
- MySQL com as tabelas `contatos` e `usuarios` criadas
- `curl` disponível no terminal

---

## Fluxo testado

### 1. Verificar se o servidor está no ar e as rotas estão protegidas

**Requisição**
```bash
curl -s http://localhost:3000/contatos
```

**Resposta esperada — 401**
```json
{ "erro": "Token não informado." }
```

Confirma que o servidor está rodando e que a rota está protegida pelo middleware `autenticar`.

---

### 2. Cadastrar usuário admin

**Requisição**
```bash
curl -s -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Maria\", \"email\": \"maria@email.com\", \"senha\": \"123456\"}"
```

**Resposta esperada — 201**
```json
{ "id": 1, "nome": "Maria", "email": "maria@email.com" }
```

A senha nunca aparece na resposta — nem em texto puro nem como hash.

---

### 3. Promover Maria a admin diretamente no banco

```sql
UPDATE usuarios SET papel = 'admin' WHERE id = 1;
```

Único meio de promover um usuário. Não existe endpoint para isso — evita escalação de privilégios via API.

---

### 4. Cadastrar usuário regular

**Requisição**
```bash
curl -s -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d "{\"nome\": \"Joao\", \"email\": \"joao@email.com\", \"senha\": \"123456\"}"
```

**Resposta esperada — 201**
```json
{ "id": 2, "nome": "Joao", "email": "joao@email.com" }
```

Criado com `papel = 'usuario'` por padrão.

---

### 5. Login como admin

**Requisição**
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"maria@email.com\", \"senha\": \"123456\"}"
```

**Resposta esperada — 200**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

O token carrega `{ id, nome, email, papel: "admin" }` no payload. Expira em 8 horas.

---

### 6. Login como usuário regular

**Requisição**
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"joao@email.com\", \"senha\": \"123456\"}"
```

**Resposta esperada — 200**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Token carrega `papel: "usuario"`.

---

### 7. Cadastrar contato (autenticado como admin)

**Requisição**
```bash
curl -s -X POST http://localhost:3000/contatos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DO_ADMIN" \
  -d "{\"nome\": \"Carlos\", \"telefone\": \"11999990000\"}"
```

**Resposta esperada — 201**
```json
{ "id": 1, "nome": "Carlos", "telefone": "11999990000", "email": null }
```

`email` retorna `null` porque não foi informado. O contato é válido — tem nome e ao menos uma forma de contato (telefone).

---

### 8. Listar contatos (autenticado como usuário regular)

**Requisição**
```bash
curl -s http://localhost:3000/contatos \
  -H "Authorization: Bearer TOKEN_DO_JOAO"
```

**Resposta esperada — 200**
```json
[
  { "id": 1, "nome": "Carlos", "telefone": "11999990000", "email": null }
]
```

Usuário regular pode listar — apenas exclusão é restrita a admin.

---

### 9. Tentar excluir como usuário regular

**Requisição**
```bash
curl -s -X DELETE http://localhost:3000/contatos/1 \
  -H "Authorization: Bearer TOKEN_DO_JOAO"
```

**Resposta esperada — 403**
```json
{ "erro": "Acesso restrito a administradores." }
```

O middleware `autorizarAdmin` intercepta antes de chegar ao controller. O contato não é excluído.

---

### 10. Excluir como admin

**Requisição**
```bash
curl -s -X DELETE http://localhost:3000/contatos/1 \
  -H "Authorization: Bearer TOKEN_DO_ADMIN"
```

**Resposta esperada — 204**
```
(sem corpo)
```

204 No Content — operação bem-sucedida, sem dados para retornar.

---

## Resumo do fluxo

```
Cadastro de usuário (POST /usuarios)
        ↓
Promoção a admin via banco (opcional)
        ↓
Login (POST /auth/login) → token JWT
        ↓
Requisições autenticadas com o token no header
  Authorization: Bearer <token>
        ↓
Middleware autenticar → valida o token
        ↓
Middleware autorizarAdmin → verifica papel (apenas no DELETE)
        ↓
Controller executa e responde
```

## Tabela de permissões confirmada

| Operação | Sem token | Usuário regular | Admin |
|---|---|---|---|
| `POST /usuarios` | ✓ | ✓ | ✓ |
| `POST /auth/login` | ✓ | ✓ | ✓ |
| `GET /contatos` | 401 | ✓ | ✓ |
| `GET /contatos/:id` | 401 | ✓ | ✓ |
| `POST /contatos` | 401 | ✓ | ✓ |
| `PUT /contatos/:id` | 401 | ✓ | ✓ |
| `DELETE /contatos/:id` | 401 | 403 | ✓ |
