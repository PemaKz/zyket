#!/usr/bin/env node
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const TemplateManager = require('../src/services/template-manager');
const EnvManager = require('../src/utils/EnvManager');
const templateManager = new TemplateManager();

(async () => {
	process.stdout.write("\u001b[2J\u001b[0;0H");
	await templateManager.boot();

	// Check for direct command (e.g., npx zyket init)
	const args = process.argv.slice(2);
	const directCommand = args[0];

	let actionToRun = null;

	if (directCommand === 'init') {
		actionToRun = 'init-project';
	} else {
		// Show interactive menu
		const response = await prompts({
			type: 'select',
			name: 'value',
			message: '[ZYKET] What do you want to do?',
			choices: [
				{ title: 'Initialize Project', value: 'init-project', description: 'Set up a new Zyket project', disabled: false },
				{ title: 'Install Template', value: 'install-template', description: 'Install a new template', disabled: false },
				/*{ title: 'Remove Template', value: 'remove-template', description: 'Remove an existing template', disabled: false },*/
			],
			initial: 0
		});
		actionToRun = response.value;
	}

	if (!actionToRun) {
		console.log('[ZYKET] No action selected. Exiting.');
		return;
	}

  const actions = {
		'init-project': async () => {
			const indexPath = path.join(process.cwd(), 'index.js');
			const envPath = path.join(process.cwd(), '.env');
			const packageJsonPath = path.join(process.cwd(), 'package.json');

			// Check if index.js already exists
			if (fs.existsSync(indexPath)) {
				const overwrite = await prompts({
					type: 'confirm',
					name: 'value',
					message: '[ZYKET] index.js already exists. Overwrite?',
					initial: false
				});
				if (!overwrite.value) {
					console.log('[ZYKET] Initialization cancelled.');
					return;
				}
			}

			// Create .env file
			console.log('[ZYKET] Creating .env file...');
			EnvManager.createEnvFile(envPath);

			// Create index.js with boilerplate code
			console.log('[ZYKET] Creating index.js...');
			const indexContent = `const { Kernel } = require('zyket');

const kernel = new Kernel();

kernel.boot().then(() => {
    console.log('Kernel booted successfully!');
}).catch((error) => {
    console.error('Error booting kernel:', error);
});
`;
			fs.writeFileSync(indexPath, indexContent);

			// Create package.json if it doesn't exist
			if (!fs.existsSync(packageJsonPath)) {
				console.log('[ZYKET] Creating package.json...');
				const packageJson = {
					name: path.basename(process.cwd()),
					version: "1.0.0",
					description: "Zyket application",
					main: "index.js",
					scripts: {
						dev: "node index.js"
					},
					keywords: [],
					author: "",
					license: "ISC",
					dependencies: {
						zyket: "^1.2.3"
					}
				};
				fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
			}

			console.log('\n[ZYKET] ✅ Project initialized successfully!');
			console.log('\n[ZYKET] Next steps:');
			console.log('  1. Review and update your .env file');
			console.log('  2. Run: npm install (if you haven\'t already)');
			console.log('  3. Run: npm run dev');
			console.log('\n[ZYKET] Happy coding! 🚀\n');
		},
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

	await actions[actionToRun]();
})();