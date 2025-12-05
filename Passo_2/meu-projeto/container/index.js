const { createSequelizeInstance } = require('../infra/db/sequelize');
const { defineContatoModel } = require('../infra/db/models/ContatoModel');
const ContatoRepositorySequelize = require('../infra/repositories/ContatoRepositorySequelize');
const ContatoService = require('../application/services/ContatoService');

// Cria instancia do Sequelize
const sequelize = createSequelizeInstance();

// Define o modelo
const ContatoModel = defineContatoModel(sequelize);

// Garante que a tabela exista (sync)
sequelize.sync()
  .then(() => console.log('Banco sincronizado com Sequelize (ORM).'))
  .catch(err => console.error('Erro ao sincronizar banco:', err));

// Cria o repository ORM
const contatoRepository = new ContatoRepositorySequelize(ContatoModel);

// Cria o service
const contatoService = new ContatoService(contatoRepository);

module.exports = {
  sequelize,
  ContatoModel,
  contatoRepository,
  contatoService
};
