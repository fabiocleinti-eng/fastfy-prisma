# Etapa 3 — Autenticação e Autorização

## Objetivo

Proteger as rotas de contatos para que apenas usuários autenticados possam acessá-las. Para isso foram implementados: cadastro de usuário, login com geração de token JWT e um middleware que valida o token em cada requisição protegida.

---

## Dependências instaladas

```bash
npm install bcrypt jsonwebtoken
```

**`bcrypt`** — algoritmo de hash para senhas. Transforma a senha em um hash irreversível antes de salvar no banco. Na hora do login, compara a senha digitada com o hash armazenado sem precisar "desencriptar" nada.

**`jsonwebtoken`** — gera e verifica tokens JWT. Após o login, o servidor emite um token que o cliente usa para provar identidade nas requisições seguintes.

---

## Tabela de usuários

Criada diretamente no MySQL antes de iniciar o servidor:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nome  VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);
```

`UNIQUE` em `email` — o banco rejeita dois cadastros com o mesmo email. É a garantia final além da validação no controller.

`VARCHAR(255)` em `senha` — o hash gerado pelo bcrypt tem 60 caracteres, mas 255 é o tamanho convencional para hashes.

---

## Estrutura de pastas

```
src/
  auth/
    authController.js    ← lógica do login
    authRouter.js        ← rota POST /auth/login
    authMiddleware.js    ← intercepta e valida o token
  usuarios/
    usuariosController.js ← lógica do cadastro
    usuariosRouter.js     ← rota POST /usuarios
```

---

## Cadastro de usuário — `src/usuarios/usuariosController.js`

```js
const hash = await bcrypt.hash(senha, 10);
```

**Por que não salvar a senha direta?**
Se o banco for comprometido, senhas em texto puro expõem todos os usuários imediatamente. Com hash, o atacante obtém apenas strings irreversíveis.

**`saltRounds: 10`**
O bcrypt gera um "salt" — um valor aleatório incorporado ao hash que impede ataques de dicionário (onde o atacante pré-computa hashes de senhas comuns). O número `10` define quantas rodadas de processamento são aplicadas. Quanto maior, mais seguro e mais lento. 10 é o valor padrão recomendado.

**HTTP 409 Conflict**
Retornado quando o email já está cadastrado. É mais preciso semanticamente que um 400 genérico — significa "conflito com o estado atual do recurso".

A resposta do cadastro **nunca inclui a senha** — nem o hash.

---

## Login — `src/auth/authController.js`

### Fluxo do login

```
1. Recebe { email, senha }
2. Busca usuário pelo email no banco
3. Se não encontrar → 401
4. Compara senha com o hash salvo (bcrypt.compare)
5. Se não bater → 401
6. Gera token JWT com os dados do usuário
7. Retorna { token }
```

### Mensagem de erro genérica

```js
res.status(401).json({ erro: 'Email ou senha inválidos.' })
```

O mesmo erro é retornado tanto quando o email não existe quanto quando a senha está errada. Mensagens diferentes ("email não encontrado" vs "senha incorreta") ajudariam um atacante a descobrir quais emails estão cadastrados no sistema.

### JWT — `jwt.sign(payload, secret, options)`

```js
const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    JWT_SECRET,
    { expiresIn: '8h' }
);
```

**`payload`** — dados incorporados ao token. Qualquer um pode ler o payload de um JWT (ele é apenas Base64), por isso a senha nunca é incluída.

**`secret`** — chave usada para **assinar** o token. A assinatura garante que o token não foi alterado. Em produção ficaria em variável de ambiente.

**`expiresIn: '8h'`** — o token expira em 8 horas, forçando novo login periodicamente.

### Estrutura de um JWT

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.assinatura
      ↑ header            ↑ payload    ↑ assinatura
```

São três partes separadas por `.`, cada uma em Base64. O servidor valida a assinatura usando o `secret` — se alguém alterar o payload, a assinatura não bate e o token é rejeitado.

---

## Middleware de autenticação — `src/auth/authMiddleware.js`

### O que é um middleware

Uma função que intercepta a requisição **antes** de chegar ao controller. Recebe `(req, res, next)`:
- Se tudo estiver correto → chama `next()` e a requisição segue
- Se houver problema → responde com erro e a requisição para

### Formato do token no header

O cliente envia o token em cada requisição protegida:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

O middleware extrai o token:

```js
const [, token] = authorization.split(' ');
// "Bearer eyJhbGci..." → ['Bearer', 'eyJhbGci...'] → pega o índice 1
```

### Verificação

```js
const payload = jwt.verify(token, JWT_SECRET);
req.usuario = payload;
next();
```

`jwt.verify` valida a assinatura e a expiração. Se o token for inválido ou expirado, lança uma exceção capturada pelo `catch`, que retorna 401. Se for válido, os dados do usuário são anexados ao `req` para uso nos controllers.

---

## Proteção das rotas — `src/contatos/contatosRouter.js`

```js
router.get('/', autenticar, listarContatos);
router.post('/', autenticar, cadastrarContato);
router.put('/:id', autenticar, atualizarContato);
router.delete('/:id', autenticar, excluirContato);
```

O middleware `autenticar` é passado como segundo argumento. O Express executa os handlers em ordem — o middleware roda primeiro e só passa para o controller se o token for válido.

---

## Endpoints ao fim desta etapa

| Método | URL | Autenticação | Ação |
|---|---|---|---|
| `POST` | `/usuarios` | Não | Cadastrar usuário |
| `POST` | `/auth/login` | Não | Login, retorna token |
| `GET` | `/contatos` | Sim | Listar contatos |
| `GET` | `/contatos/:id` | Sim | Buscar contato |
| `POST` | `/contatos` | Sim | Cadastrar contato |
| `PUT` | `/contatos/:id` | Sim | Atualizar contato |
| `DELETE` | `/contatos/:id` | Sim | Excluir contato |

---

## Fluxo completo de uma requisição protegida

```
GET /contatos
Authorization: Bearer eyJhbGci...
        ↓
authMiddleware.js   → extrai e verifica o token
        ↓ (token válido)
contatosController.js → executa listarContatos
        ↓
pool.execute('SELECT * FROM contatos')
        ↓
res.json([...])
```

Sem o token:
```
GET /contatos
        ↓
authMiddleware.js → 401 { erro: 'Token não informado.' }
        ↑ a requisição para aqui, o controller nunca é chamado
```
