// Alias sem versão de /api/checkout/v1/pay — mantido para não quebrar clientes
// antigos. A implementação vive na rota versionada; aqui só reexportamos.
export { POST } from "../v1/pay/route";
