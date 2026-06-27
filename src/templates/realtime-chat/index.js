const { Kernel } = require('zyket');

const kernel = new Kernel({
  services: [
    ['auth', require('./src/services/auth'), ['@service_container']],
  ],
});

kernel.boot().then(async () => {
  await kernel.container.get('database').sync();
  kernel.container.get('logger').info('realtime-chat template ready (ws + http)');
}).catch((error) => {
  console.error('Error booting kernel:', error);
});
