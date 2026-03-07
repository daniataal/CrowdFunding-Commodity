// interactive-console.js
// Run this script via: node interactive-console.js
// Ensure you are in the CrowdFunding-Commodity directory.

const repl = require('repl');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log(`
===================================================
Welcome to the Crowdfunding Interactive DB Console!
Powered by Prisma and Node REPL.
===================================================

Available Globals:
- 'db': The Prisma client instance.
- Example usage: 
    await db.deal.findMany()
    await db.user.findUnique({ where: { email: '...' } })

Type '.exit' to quit.
`);

const replServer = repl.start({
    prompt: 'crowdfunding-console > ',
    useColors: true,
    ignoreUndefined: true,
});

// Inject prisma into the global context as 'db'
replServer.context.db = prisma;

replServer.on('exit', async () => {
    await prisma.$disconnect();
    console.log('Database connection closed. Goodbye!');
    process.exit();
});
