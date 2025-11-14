var express = require('express');
var router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const validarCPF = require('../public/javascripts/cpf-validator').validarCPF;

/**
 * GET /contato – exibe o formulário.
 * Enviamos 'data' vazio e 'errors' vazio para facilitar o template.
 */
router.get('/', (req, res) => {
  res.render('contato', {
    title: 'Formulário de Contato',
    data: {},
    errors: {}  });
});

// GET /contato/lista – tabela com os contatos cadastrados
router.get('/lista', (req, res) => {
  const rows = db.prepare(`
    SELECT id, nome, cpf, email, idade, genero, interesses, ocupacao, mensagem, criado_em
    FROM contatos
    ORDER BY criado_em DESC
  `).all();

  res.render('contatos-lista', {
    title: 'Lista de Contatos',
    contatos: rows
  });
});

// GET /contato/:id/editar – exibe o formulário de edição
router.get('/:id/editar', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.redirect('/contato/lista');
  }

  const contato = db.prepare('SELECT * FROM contatos WHERE id = ?').get(id);

  if (!contato) {
    return res.redirect('/contato/lista');
  }

  // Converte interesses de string para array
  const data = {
    ...contato,
    interesses: contato.interesses ? contato.interesses.split(',') : [],
    aceite: contato.aceite === 1
  };

  res.render('contato-editar', {
    title: 'Editar Contato',
    data,
    errors: {}
  });
});

// POST /contato/:id/editar – processa a atualização
router.post('/:id/editar',
  [
    body('nome')
      .trim().isLength({ min: 3, max: 60 }).withMessage('Nome deve ter entre 3 e 60 caracteres.')
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/).withMessage('Nome contém caracteres inválidos.')
      .escape(),
    body('cpf')
      .trim().isLength({ min: 11, max: 11 }).withMessage('CPF deve ter 11 caracteres.')
      .matches(/^\d{11}$/).withMessage('CPF deve conter apenas números.')
      .custom((value) => {
        if (!validarCPF(value)) {
          throw new Error('CPF inválido.');
        }
        return true;
      })
      .escape(),
    body('email')
      .trim().isEmail().withMessage('E-mail inválido.')
      .normalizeEmail(),
    body('idade')
      .trim().optional({ checkFalsy: true })
      .isInt({ min: 1, max: 120 }).withMessage('Idade deve ser um inteiro entre 1 e 120.')
      .toInt(),
    body('genero')
      .isIn(['', 'feminino', 'masculino', 'nao-binario', 'prefiro-nao-informar'])
      .withMessage('Gênero inválido.'),
    body('interesses')
      .optional({ checkFalsy: true })
      .customSanitizer(v => Array.isArray(v) ? v : (v ? [v] : []))
      .custom((arr) => {
        const valid = ['node', 'express', 'ejs', 'frontend', 'backend'];
        return arr.every(x => valid.includes(x));
      }).withMessage('Interesse inválido.'),
    body('ocupacao')
      .isIn(['', 'estudante-fundamental','estudante-medio','estudante-superior', 'desenvolvedor-front-end','desenvolvedor-back-end', 'dba','presidente','diretor','organizador-evento', 'prefiro-nao-informar'])
      .withMessage('Ocupação inválida.'),
    body('mensagem')
      .trim().isLength({ min: 10, max: 500 }).withMessage('Mensagem deve ter entre 10 e 500 caracteres.')
      .escape(),
    body('aceite')
      .equals('on').withMessage('Você deve aceitar os termos para continuar.')
  ],
  (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.redirect('/contato/lista');
    }

    const errors = validationResult(req);

    const data = {
      id,
      nome: req.body.nome,
      cpf: req.body.cpf,
      email: req.body.email,
      idade: req.body.idade,
      genero: req.body.genero || '',
      interesses: req.body.interesses || [],
      ocupacao: req.body.ocupacao || '',
      mensagem: req.body.mensagem,
      aceite: req.body.aceite === 'on'
    };

    if (!errors.isEmpty()) {
      const mapped = errors.mapped();
      return res.status(400).render('contato-editar', {
        title: 'Editar Contato',
        data,
        errors: mapped
      });
    }

    const stmt = db.prepare(`
      UPDATE contatos 
      SET nome = @nome, cpf = @cpf, email = @email, idade = @idade, 
          genero = @genero, interesses = @interesses, ocupacao = @ocupacao, mensagem = @mensagem, aceite = @aceite
      WHERE id = @id
    `);

    stmt.run({
      id,
      nome: data.nome,
      cpf: data.cpf,
      email: data.email,
      idade: data.idade || null,
      genero: data.genero || null,
      interesses: Array.isArray(data.interesses)
        ? data.interesses.join(',')
        : (data.interesses || ''),
      ocupacao: data.ocupacao || null,
      mensagem: data.mensagem,
      aceite: data.aceite ? 1 : 0
    });

    return res.redirect('/contato/lista');
  }
);

// POST /contato/:id/delete – exclui um contato pelo ID
router.post('/:id/delete', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    // ID inválido → só volta
    return res.redirect('/contato/lista');
  }

  const info = db.prepare('DELETE FROM contatos WHERE id = ?').run(id);

  // Opcional: você pode testar se algo foi deletado
  if (info.changes === 0) { console.log('Nenhum registro com esse ID'); }

  return res.redirect('/contato/lista');
});

/**
 * POST /contato – valida, sanitiza e decide: erro -> reexibir formulário; sucesso -> página de sucesso
 */
router.post('/',
  // Validações e sanitizações
  [
    body('nome')
      .trim().isLength({ min: 3, max: 60 }).withMessage('Nome deve ter entre 3 e 60 caracteres.')
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/).withMessage('Nome contém caracteres inválidos.')
      .escape(),
      body('cpf')
      .trim().isLength({ min: 11, max: 11 }).withMessage('CPF deve ter 11 caracteres.')
      .matches(/^\d{11}$/).withMessage('CPF deve conter apenas números.')
      .custom((value) => {
        if (!validarCPF(value)) {
          throw new Error('CPF inválido.');
        }
        return true;
      })
      .escape(),
    body('email')
      .trim().isEmail().withMessage('E-mail inválido.')
      .normalizeEmail(),
    body('idade')
      .trim().optional({ checkFalsy: true })
      .isInt({ min: 1, max: 120 }).withMessage('Idade deve ser um inteiro entre 1 e 120.')
      .toInt(),
    body('genero')
      .isIn(['', 'feminino', 'masculino', 'nao-binario', 'prefiro-nao-informar'])
      .withMessage('Gênero inválido.'),
    body('interesses')
      .optional({ checkFalsy: true })
      .customSanitizer(v => Array.isArray(v) ? v : (v ? [v] : [])) // sempre array
      .custom((arr) => {
        const valid = ['node', 'express', 'ejs', 'frontend', 'backend'];
        return arr.every(x => valid.includes(x));
      }).withMessage('Interesse inválido.'),
    body('ocupacao')
      .isIn(['', 'estudante-fundamental','estudante-medio','estudante-superior', 'desenvolvedor-front-end','desenvolvedor-back-end', 'dba','presidente','diretor','organizador-evento', 'prefiro-nao-informar'])
      .withMessage('Ocupação inválida.'),
    body('mensagem')
      .trim().isLength({ min: 10, max: 500 }).withMessage('Mensagem deve ter entre 10 e 500 caracteres.')
      .escape(),
    body('aceite')
      .equals('on').withMessage('Você deve aceitar os termos para continuar.')
  ],
  (req, res) => {
    const errors = validationResult(req);
 // Para repovoar o formulário, mantemos os dados originais (com algumas sanitizações acima)
    const data = {
      nome: req.body.nome,
      cpf: req.body.cpf,
      email: req.body.email,
      idade: req.body.idade,
      genero: req.body.genero || '',
      interesses: req.body.interesses || [],
      ocupacao: req.body.ocupacao || '',
      mensagem: req.body.mensagem,
      aceite: req.body.aceite === 'on'
    };

    if (!errors.isEmpty()) {
      const mapped = errors.mapped();
      return res.status(400).render('contato', {
        title: 'Formulário de Contato',
        data,
        errors: mapped
      });
    }

    const stmt = db.prepare(`
      INSERT INTO contatos (nome, cpf, email, idade, genero, interesses, ocupacao, mensagem, aceite)
      VALUES (@nome, @cpf, @email, @idade, @genero, @interesses, @ocupacao, @mensagem, @aceite)
    `);    
    // Aqui você poderia persistir no banco, enviar e-mail, etc.

    stmt.run({
      nome: data.nome,
      cpf: data.cpf,
      email: data.email,
      idade: data.idade || null,
      genero: data.genero || null,
      interesses: Array.isArray(data.interesses)
        ? data.interesses.join(',')
        : (data.interesses || ''),
      ocupacao: data.ocupacao || null,
      mensagem: data.mensagem,
      aceite: data.aceite ? 1 : 0
    });
    

    return res.render('sucesso', {
      title: 'Enviado com sucesso',
      data
    });
    
  }
);

module.exports = router;