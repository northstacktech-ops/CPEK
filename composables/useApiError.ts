// CPEK — extrai uma mensagem de erro acionável da resposta da API (issues de
// validação zod, ou { error: { message } } do apiError do servidor), em vez
// de sempre mostrar um texto genérico que esconde o motivo real da falha.
interface ApiErrorIssue {
  path?: Array<string | number>
  message: string
}

interface ApiErrorData {
  error?: { code?: string; message?: string }
  issues?: ApiErrorIssue[]
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: ApiErrorData } | undefined)?.data
  const issue = data?.issues?.[0]
  if (issue) {
    const field = issue.path?.length ? issue.path.join('.') : null
    return field ? `${field}: ${issue.message}` : issue.message
  }
  if (data?.error?.message) return data.error.message
  return fallback
}
