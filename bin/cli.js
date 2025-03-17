#!/usr/bin/env node
const prompts = require('prompts');
const TemplateManager = require('../src/services/template-manager');
const templateManager = new TemplateManager();

(async () => {
	process.stdout.write("\u001b[2J\u001b[0;0H");
	await templateManager.boot();
  const response = await prompts({
		type: 'select',
		name: 'value',
		message: '[ZYKET] What do you want to do?',
		choices: [
			{ title: 'Install Template', value: 'install-template', description: 'Install a new template', disabled: false },
			/*{ title: 'Remove Template', value: 'remove-template', description: 'Remove an existing template', disabled: false },*/
		],
		initial: 0
	});

  const actions = {
		'install-template': async () => {
			const templates = templateManager.getTemplates();
			const response = await prompts({
				type: 'select',
				name: 'templateToInstall',
				message: '[ZYKET] What template would you like to install?',
				choices: [
					...templates.map((template) => ({ title: template.toUpperCase(), value: template, description: '', disabled: false })),
				],
				initial: 0
			});
			if(!templateManager.exists(response.templateToInstall)) throw new Error(`Template ${response.templateToInstall} not found`);
			templateManager.installTemplate(response.templateToInstall);
		},
		/*'remove-template': async () => {
			const response = await prompts({
				type: 'select',
				name: 'templateToRemove',
				message: '[ZYKET] What template would you like to remove?',
				choices: [
					{ title: 'Auth', value: 'auth', description: 'Authentication template', disabled: false },
					{ title: 'Chat', value: 'chat', description: 'Chat template', disabled: false },
				],
				initial: 0
			});
			console.log(`Removing template: ${response.templateToRemove}`);
		}*/
	};

	await actions[response.value]();
})();