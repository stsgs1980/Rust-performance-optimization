import { PrismaClient } from '@prisma/client'
import { resolve, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/dev.db'
  const match = rawUrl.match(/^file:(.+)/)
  if (!match) return rawUrl
  const dbPath = resolve(process.cwd(), match[1])
  const dir = dirname(dbPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return `file:${dbPath}`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: `${getDatabaseUrl()}?connection_limit=1&pool_timeout=0`,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
