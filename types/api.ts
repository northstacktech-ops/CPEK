// CPEK — contrato de erro padronizado (ARCHITECTURE §8).
export interface ApiError {
  error: { code: string; message: string }
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}
