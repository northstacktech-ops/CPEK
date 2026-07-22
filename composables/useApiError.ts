// CPEK — extrai uma mensagem de erro acionável da resposta da API (issues de
// validação zod, ou { error: { message } } do apiError do servidor), em vez
// de sempre mostrar um texto genérico que esconde o motivo real da falha.
//
// O corpo de erro do Nitro/h3 chega envelopado — `err.data` (que o ofetch/
// $fetch expõe no erro lançado) é o JSON inteiro da resposta:
// { statusCode, statusMessage, message, data: { error: {...}, issues? }, stack? }.
// O payload que o `apiError()`/`validateBody`/`validateQuery` do servidor monta
// fica um nível abaixo, em `err.data.data` — não em `err.data` direto.
interface ApiErrorIssue {
  path?: Array<string | number>
  message: string
}

interface ApiErrorEnvelope {
  message?: string
  data?: {
    error?: { code?: string; message?: string }
    issues?: ApiErrorIssue[]
  }
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const envelope = (err as { data?: ApiErrorEnvelope } | undefined)?.data
  const issue = envelope?.data?.issues?.[0]
  if (issue) {
    const field = issue.path?.length ? issue.path.join('.') : null
    return field ? `${field}: ${issue.message}` : issue.message
  }
  if (envelope?.data?.error?.message) return envelope.data.error.message
  // Rede de segurança: qualquer erro do servidor que não usou apiError() ainda
  // assim tem `statusMessage`/`message` — melhor mostrar isso que o fallback genérico.
  if (envelope?.message) return envelope.message
  // Erros que não vieram de uma resposta de API (ex.: AuthError do Supabase,
  // ou um `throw new Error(...)` de validação no client) não têm `.data` — o
  // próprio `.message` já é a informação específica, não um envelope genérico.
  const topMessage = (err as { message?: string } | undefined)?.message
  if (topMessage) return topMessage
  return fallback
}
