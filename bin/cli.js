const prompts = require('prompts');

(async () => {
	process.stdout.write("\u001b[2J\u001b[0;0H");
  const response = await prompts({
		type: 'select',
		name: 'value',
		message: '[ZYKET] What do you want to do?',
		choices: [
			{ title: 'Install Template', value: 'install-template', description: 'Install a new template', disabled: false },
			{ title: 'Remove Template', value: 'remove-template', description: 'Remove an existing template', disabled: false }
		],
		initial: 0
	});

  const actions = {
		'install-template': async () => {
			console.log('Installing template');
		},
		'remove-template': async () => {
			console.log('Removing template');
		}
	};

	await actions[response.value]();

	await new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 2000);
	});
})();