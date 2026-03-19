import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🗑️  Clearing all data from database...')
  await prisma.statusHistory.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.deliveryAgent.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleared successfully — all tables are empty.')
}

main()
  .catch((e) => {
    console.error('❌ Error clearing database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
