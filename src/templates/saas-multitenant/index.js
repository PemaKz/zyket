const { Kernel } = require('zyket');

const kernel = new Kernel({
  services: [
    ['auth', require('./src/services/auth'), ['@service_container']],
  ],
});

kernel.boot().then(async () => {
  await kernel.container.get('database').sync();
  kernel.container.get('logger').info('saas-multitenant template ready');
}).catch((error) => {
  console.error('Error booting kernel:', error);
});
