const { Kernel } = require('zyket');

const kernel = new Kernel({
  services: [
    // The database and express services are auto-registered by the framework
    // (they activate from your .env). We only register the auth service here.
    ['auth', require('./src/services/auth'), ['@service_container']],
  ],
});

kernel.boot().then(async () => {
  // Create the example tables (Task). The better-auth tables come from
  // `container.get('auth').migrate()` or the better-auth CLI (see README).
  await kernel.container.get('database').sync();
  kernel.container.get('logger').info('api-rest template ready — try GET /tasks');
}).catch((error) => {
  console.error('Error booting kernel:', error);
});
