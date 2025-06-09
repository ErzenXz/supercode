const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Test the connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Create a test user if none exists
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
        },
      })
      console.log('✅ Demo user created')
    }
    
    console.log('✅ Database initialization complete')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
