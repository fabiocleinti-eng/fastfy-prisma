# API de Agenda de Contatos

API REST para gerenciamento de contatos com autenticação JWT e controle de acesso por papel de usuário.

---

## Tecnologias

- **Node.js** com ES Modules
- **Express 5**
- **MySQL 2**
- **bcrypt** — hash de senhas
- **jsonwebtoken** — autenticação via JWT
- **nodemon** — reload automático em desenvolvimento

---

## Pré-requisitos

- Node.js instalado
- MySQL instalado e rodando

---

## Instalação

```bash
git clone <url-do-repositorio>
cd api-contatos
npm install
```

---

## Configuração do banco de dados

Execute os comandos abaixo no MySQL:

```sql
CREATE DATABASE IF NOT EXISTS api_contatos;

USE api_contatos;

CREATE TABLE IF NOT EXISTS contatos (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    telefone VARCHAR(20)  NULL,
    email    VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nome  VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    papel ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario'
);
```

Abra [src/db/connection.js](src/db/connection.js) e ajuste as credenciais se necessário:

```js
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'api_contatos',
});
```

---

## Rodando o servidor

```bash
# desenvolvimento (com reload automático)
npm run dev

# produção
npm start
```

Servidor disponível em `http://localhost:3000`.

---

## Endpoints

### Usuários

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/usuarios` | Não | Cadastrar usuário |

**Body:**
```json
{ "nome": "Maria", "email": "maria@email.com", "senha": "123456" }
```

---

### Autenticação

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | Não | Login, retorna token JWT |

**Body:**
```json
{ "email": "maria@email.com", "senha": "123456" }
```

**Resposta:**
```json
{ "token": "eyJhbGci..." }
```

---

### Contatos

| Método | Rota | Autenticação | Papel mínimo | Descrição |
|---|---|---|---|---|
| `GET` | `/contatos` | Sim | usuario | Listar contatos |
| `GET` | `/contatos/:id` | Sim | usuario | Buscar contato |
| `POST` | `/contatos` | Sim | usuario | Cadastrar contato |
| `PUT` | `/contatos/:id` | Sim | usuario | Atualizar contato |
| `DELETE` | `/contatos/:id` | Sim | admin | Excluir contato |

**Header obrigatório nas rotas autenticadas:**
```
Authorization: Bearer <token>
```

**Body (POST e PUT):**
```json
{ "nome": "Carlos", "telefone": "11999990000" }
```
Nome é obrigatório. Ao menos um entre `telefone` e `email` deve ser informado.

---

## Papéis de usuário

| Papel | Permissões |
|---|---|
| `usuario` | Listar, buscar, cadastrar e atualizar contatos |
| `admin` | Tudo acima + excluir contatos |

Todo usuário cadastrado recebe o papel `usuario` por padrão. Para promover a admin, execute diretamente no banco:

```sql
UPDATE usuarios SET papel = 'admin' WHERE id = 1;
```

---

## Estrutura do projeto

```
api-contatos/
  src/
    auth/
      authController.js    # lógica do login
      authMiddleware.js    # middlewares autenticar e autorizarAdmin
      authRouter.js
    contatos/
      contatosController.js
      contatosRouter.js
    usuarios/
      usuariosController.js
      usuariosRouter.js
    db/
      connection.js        # pool de conexão MySQL
    app.js                 # configuração do Express
    router.js              # registro central de rotas
  docs/                    # documentação por etapa de desenvolvimento
  server.js                # ponto de entrada
```

---

## Documentação de desenvolvimento

O diretório [docs/](docs/) contém o registro detalhado de cada etapa do projeto:

- [01 — Setup e CRUD básico](docs/01-setup-e-crud.md)
- [02 — Banco de dados](docs/02-banco-de-dados.md)
- [03 — Autenticação](docs/03-autenticacao.md)
- [04 — Autorização por papel](docs/04-autorizacao-por-papel.md)
- [05 — Teste do fluxo completo](docs/05-teste-fluxo-completo.md)
