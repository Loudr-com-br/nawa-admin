// Alias retrocompatível — a implementação vive em /v1 (versionamento da
// fronteira, api-boundary §3.4). Rotas sem versão seguem funcionando p/ o
// que já está em produção; o novo é servido pela versão /v1.
export { GET } from "../v1/orders/route";
