const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'contatos.db');
const db = new Database(dbPath);

// Criação da tabela (roda uma vez e garante estrutura)
db.prepare(`
  CREATE TABLE IF NOT EXISTS contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT NOT NULL,
    idade INTEGER,
    genero TEXT,
    interesses TEXT,
    mensagem TEXT NOT NULL,
    aceite INTEGER NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Adiciona a coluna CPF se ela não existir (para bancos antigos)
try {
  db.prepare('ALTER TABLE contatos ADD COLUMN cpf TEXT').run();
  console.log('Coluna CPF adicionada à tabela contatos');
} catch (err) {
  // Coluna já existe, tudo bem
  if (!err.message.includes('duplicate column name')) {
    console.error('Erro ao adicionar coluna CPF:', err.message);
  }
}

module.exports = db;