// ==============================================================================
// E-CCB EA SÚP — PRISMA CONFIGURATION (Tương thích Prisma v6 & Prisma v7+)
// ==============================================================================

export default {
  migrations: {
    seed: "npx tsx --env-file=.env prisma/seed.ts",
  },
};
