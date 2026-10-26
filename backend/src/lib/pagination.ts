import { z } from 'zod';

export const paginationQuery = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(50).default(12),
});

export type Pagination = z.infer<typeof paginationQuery>;

export const skipTake = ({ pagina, porPagina }: Pagination) => ({
  skip: (pagina - 1) * porPagina,
  take: porPagina,
});

export const paginated = <T>(data: T[], total: number, { pagina, porPagina }: Pagination) => ({
  data,
  meta: { pagina, porPagina, total, totalPaginas: Math.ceil(total / porPagina) },
});
