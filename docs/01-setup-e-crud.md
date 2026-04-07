# Etapa 1 — Setup Inicial e CRUD de Contatos

## Objetivo

Criar a estrutura base do projeto e implementar as quatro operações fundamentais sobre contatos: cadastrar, listar, buscar e excluir.

---

## Dependências instaladas

```bash
npm install express
npm install nodemon --save-dev
```

**`express`** — framework web para Node.js. Abstrai o tratamento de requisições HTTP, roteamento e middlewares, evitando ter que lidar com o módulo `http` nativo do Node diretamente.

**`nodemon`** — ferramenta de desenvolvimento que reinicia o servidor automaticamente sempre que um arquivo é alterado. Instalado como `devDependency` porque só é necessário durante o desenvolvimento, não em produção.

---

## Configuração do `package.json`

```json
"type": "module"
```

Adicionado para habilitar ES Modules no projeto. Isso permite usar a sintaxe moderna de importação:

```js
// ES Modules (usado no projeto)
import express from 'express';
export default app;

// CommonJS (alternativa antiga, não usada)
const express = require('express');
module.exports = app;
```

```json
"scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
}
```

- `npm start` — inicia o servidor em modo produção
- `npm run dev` — inicia com nodemon para desenvolvimento

---

## Estrutura de pastas

```
api-contatos/
  src/
    contatos/
      contatosController.js
      contatosRouter.js
    app.js
    router.js
  server.js
  package.json
  .gitignore
```

A organização foi feita **por domínio**, não por tipo de arquivo. Tudo relacionado a contatos fica dentro de `src/contatos/`, tornando o projeto fácil de navegar conforme cresce.

| Arquivo | Responsabilidade |
|---|---|
| `server.js` | Inicializa o servidor (único ponto de entrada) |
| `src/app.js` | Configura o Express e registra middlewares globais |
| `src/router.js` | Ponto central de registro de todas as rotas |
| `src/contatos/contatosRouter.js` | Mapeia as URLs para as funções do controller |
| `src/contatos/contatosController.js` | Contém a lógica de cada operação |

---

## Fluxo de uma requisição

```
Requisição HTTP
      ↓
server.js              → apenas ouve a porta 3000
      ↓
app.js                 → aplica express.json() (interpreta o body em JSON)
      ↓
router.js              → /contatos → delega ao contatosRouter
      ↓
contatosRouter.js      → POST / → chama cadastrarContato
      ↓
contatosController.js  → executa a lógica e responde
```

---

## Os arquivos

### `server.js`

```js
import app from './src/app.js';

const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
```

Responsabilidade única: ligar o servidor. Não contém nenhuma lógica de aplicação.

---

### `src/app.js`

```js
import express from 'express';
import router from './router.js';

const app = express();

app.use(express.json());
app.use(router);

export default app;
```

`express.json()` é um middleware que interpreta o corpo das requisições com `Content-Type: application/json` e disponibiliza os dados em `req.body`. Sem ele, `req.body` seria `undefined`.

---

### `src/router.js`

```js
import { Router } from 'express';
import contatosRouter from './contatos/contatosRouter.js';

const router = Router();

router.use('/contatos', contatosRouter);

export default router;
```

O `app.js` só conhece esse arquivo. Toda rota nova (ex: `/usuarios`) é registrada aqui, mantendo o `app.js` limpo.

---

### `src/contatos/contatosRouter.js`

```js
import { Router } from 'express';
import { cadastrarContato, listarContatos, buscarContato, atualizarContato, excluirContato } from './contatosController.js';

const router = Router();

router.post('/', cadastrarContato);
router.get('/', listarContatos);
router.get('/:id', buscarContato);
router.put('/:id', atualizarContato);
router.delete('/:id', excluirContato);

export default router;
```

As rotas aqui são **relativas** ao prefixo `/contatos` definido no `router.js`. Portanto `'/'` equivale a `/contatos` e `'/:id'` equivale a `/contatos/:id`.

---

### `src/contatos/contatosController.js`

Nessa etapa, os dados eram armazenados em um **array em memória** — sem banco de dados. Os dados eram perdidos a cada reinício do servidor.

#### Validações aplicadas em todas as operações de escrita

```js
if (!nome) {
    return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
}

if (!telefone && !email) {
    return res.status(400).json({ erro: 'Informe ao menos um telefone ou email.' });
}
```

- `nome` é obrigatório
- Ao menos um dos dois (`telefone` ou `email`) deve estar presente

#### Códigos HTTP utilizados

| Código | Significado | Quando é retornado |
|---|---|---|
| `200` | OK | Listagem e busca com sucesso |
| `201` | Created | Contato cadastrado com sucesso |
| `204` | No Content | Contato excluído com sucesso |
| `400` | Bad Request | Dados inválidos ou ausentes |
| `404` | Not Found | Contato não encontrado pelo ID |

---

## `.gitignore`

```
node_modules/
```

A pasta `node_modules/` não deve ser versionada. Ela pode conter centenas de megabytes e é completamente regenerável a partir do `package.json` com `npm install`. Qualquer pessoa que clonar o repositório executa `npm install` e obtém as mesmas dependências.

---

## Endpoints disponíveis ao fim desta etapa

| Método | URL | Ação |
|---|---|---|
| `POST` | `/contatos` | Cadastrar um contato |
| `GET` | `/contatos` | Listar todos os contatos |
| `GET` | `/contatos/:id` | Buscar um contato pelo ID |
| `PUT` | `/contatos/:id` | Atualizar um contato |
| `DELETE` | `/contatos/:id` | Excluir um contato |
