const { DataTypes } = require('sequelize');

function defineContatoModel(sequelize) {
  const ContatoModel = sequelize.define('Contato', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    idade: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    genero: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    interesses: {
      // Aqui vamos armazenar como STRING: "node,express,ejs"
      type: DataTypes.STRING,
      allowNull: true
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    aceite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'contatos',
    timestamps: true,          // cria createdAt, updatedAt
    createdAt: 'criado_em',    // renomeia para combinar com seu schema
    updatedAt: 'atualizado_em'
  });

  return ContatoModel;
}

module.exports = { defineContatoModel };
