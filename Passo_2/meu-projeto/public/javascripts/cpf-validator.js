function validarCPF(cpf) {

  //ve se todos os digitos são iguais  
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // calculo da soma do cpf (primeiro digito verificador)
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 > 9) digito1 = 0;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 > 9) digito2 = 0;

  return cpf[9] == digito1 && cpf[10] == digito2;
}

module.exports = { validarCPF };