// Alias retrocompatível — a implementação vive em /v1 (versionamento da
// fronteira, api-boundary §3.4). Rotas sem versão continuam funcionando p/ o
// que já está em produção; o novo é servido por /api/storefront/v1/*.
export { GET } from "../v1/search/route";
