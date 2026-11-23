// Extrai o texto de erro retornado pela API (corpo texto puro ou JSON) ou a mensagem do Axios
export function extrairMensagemErro(erro, mensagemPadrao) {
  const dados = erro?.response?.data;
  if (typeof dados === 'string' && dados) return dados;
  if (dados?.message) return dados.message;
  return erro?.message || mensagemPadrao;
}
