import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto assets estáticos e imagens:
     * _next/static, _next/image, favicon e arquivos de imagem.
     */
    "/((?!_next/static|_next/image|favicon.svg|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
