# Etapa 2 — Banco de Dados MySQL

## Objetivo

Substituir o armazenamento em memória por um banco de dados MySQL real, garantindo que os dados persistam entre reinícios do servidor.

---

## Por que banco de dados?

O array em memória da etapa anterior tinha um problema fundamental: ao reiniciar o servidor, todos os dados eram perdidos. Um banco de dados resolve isso mantendo os dados gravados em disco.

Além disso, a etapa seguinte (autenticação) exige persistência de usuários — senhas não podem desaparecer com o servidor.

---

## Dependência instalada

```bash
npm install mysql2
```

**`mysql2`** é o driver que permite o Node.js se comunicar com o MySQL. Sem ele, o Node não tem suporte nativo a bancos MySQL.

Foi escolhido `mysql2` e não `mysql` (o pacote original) pelos seguintes motivos:

| | `mysql` | `mysql2` |
|---|---|---|
| Status | Abandonado desde 2020 | Mantido ativamente |
| Promises / async-await | Não suporta nativamente | Suporta via `mysql2/promise` |
| Performance | Menor | Maior |
| Autenticação MySQL moderno | Problemas | Compatível |

---

## Criação do banco e da tabela

Executado diretamente no MySQL, antes de iniciar o servidor:

```sql
CREATE DATABASE IF NOT EXISTS api_contatos;

USE api_contatos;

CREATE TABLE IF NOT EXISTS contatos (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100)  NOT NULL,
    telefone VARCHAR(20)   NULL,
    email    VARCHAR(100)  NULL
);
```

### Explicação de cada parte

**`CREATE DATABASE IF NOT EXISTS api_contatos`**
Cria o banco de dados. `IF NOT EXISTS` evita erro caso o banco já exista — o comando pode ser rodado múltiplas vezes.

**`id INT AUTO_INCREMENT PRIMARY KEY`**
- `INT` — número inteiro
- `AUTO_INCREMENT` — o MySQL gera o próximo ID automaticamente (1, 2, 3...). Não é necessário informar ao inserir um registro
- `PRIMARY KEY` — garante unicidade: nunca dois contatos com o mesmo `id`

**`nome VARCHAR(100) NOT NULL`**
- `VARCHAR(100)` — texto de até 100 caracteres
- `NOT NULL` — o campo é obrigatório no nível do banco, como segunda camada de proteção além da validação no controller

**`telefone VARCHAR(20) NULL` e `email VARCHAR(100) NULL`**
Ambos aceitam `NULL` porque o requisito permite que apenas um dos dois esteja presente. A validação de qual foi fornecido é responsabilidade do controller.

---

## `src/db/connection.js`

```js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'api_contatos',
});

export default pool;
```

### Por que uma pasta `db/`?

Isola tudo relacionado ao banco em um único lugar. Se o banco de dados mudar (ex: de MySQL para PostgreSQL), apenas esse arquivo precisa ser alterado — o resto do projeto não sabe como a conexão funciona internamente.

### `mysql2/promise` vs `mysql2`

O pacote `mysql2` tem duas formas de uso:

```js
import mysql from 'mysql2';         // callbacks
import mysql from 'mysql2/promise'; // async/await ← usado no projeto
```

Importando `mysql2/promise`, todas as operações retornam Promises, o que permite usar `async/await` no controller, tornando o código mais legível.

### Pool de conexões

`createPool` abre um conjunto de conexões e as mantém abertas para reutilização.

**Sem pool (`createConnection`):**
```
Requisição 1 → abre conexão → executa query → fecha conexão
Requisição 2 → abre conexão → executa query → fecha conexão
```

**Com pool:**
```
Servidor inicia → pool abre N conexões

Requisição 1 → pega conexão disponível → executa → devolve ao pool
Requisição 2 → pega conexão disponível → executa → devolve ao pool
```

Abrir uma conexão tem custo: handshake TCP + autenticação MySQL. O pool elimina esse custo a cada requisição reutilizando conexões já estabelecidas. Quando chegam mais requisições do que conexões disponíveis, as extras aguardam na fila em vez de sobrecarregar o banco.

### `export default pool`

O pool é exportado para que qualquer arquivo do projeto importe e use **a mesma instância**. Se cada arquivo criasse seu próprio pool, haveria múltiplos conjuntos de conexões abertos simultaneamente — desperdício de recursos.

---

## Atualização do controller

As funções do controller foram reescritas de síncronas para assíncronas.

### `async/await`

Operações de banco envolvem I/O de rede: o Node envia a query, o MySQL processa, o resultado volta. Isso não é instantâneo. O `await` pausa a função até o resultado chegar, sem bloquear o servidor para outras requisições.

### Placeholders (`?`)

```js
pool.execute('INSERT INTO contatos (nome) VALUES (?)', [nome])
```

Os `?` são substituídos pelos valores do array de forma segura pelo `mysql2`. A alternativa — concatenar strings — abre brecha para **SQL Injection**:

```js
// NUNCA fazer isso:
`INSERT INTO contatos (nome) VALUES ('${nome}')`
// Um usuário malicioso poderia enviar: nome = "'; DROP TABLE contatos; --"
```

Os placeholders eliminam completamente esse risco.

### Null coalescing (`??`)

```js
telefone ?? null
```

Se `telefone` não foi enviado na requisição, seu valor em JavaScript é `undefined`. O MySQL não conhece `undefined` — apenas `null`. O operador `??` converte `undefined` para `null` antes de enviar ao banco.

### `resultado.insertId`

Após um `INSERT`, o MySQL retorna o ID gerado pelo `AUTO_INCREMENT`. O `mysql2` expõe isso em `resultado.insertId`, permitindo devolver o contato completo com o ID correto na resposta.

### `resultado.affectedRows`

No `UPDATE` e `DELETE`, indica quantas linhas foram afetadas. Se for `0`, nenhum contato com aquele ID existe no banco — retorna `404`.

---

## Estrutura de pastas ao fim desta etapa

```
api-contatos/
  src/
    contatos/
      contatosController.js   ← reescrito para usar o banco
      contatosRouter.js
    db/
      connection.js           ← novo
    app.js
    router.js
  server.js
  package.json
  .gitignore
```

---

## Fluxo completo de uma requisição com banco

```
POST /contatos  { nome: "João", telefone: "11999990000" }
        ↓
contatosRouter.js      → chama cadastrarContato
        ↓
contatosController.js  → valida os campos
        ↓
pool.execute('INSERT INTO contatos ...')  → envia query ao MySQL
        ↓
MySQL executa, gera id=1, devolve resultado
        ↓
controller monta { id: 1, nome: "João", telefone: "11999990000" }
        ↓
res.status(201).json(...)  → resposta ao cliente
```
