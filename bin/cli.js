#!/usr/bin/env node
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const TemplateManager = require('../src/services/template-manager');
const EnvManager = require('../src/utils/EnvManager');
const templateManager = new TemplateManager();

const ZYKET_PKG = (() => {
	try { return require('../package.json'); } catch { return { version: '1.0.0', dependencies: {} }; }
})();
const ZYKET_VERSION = ZYKET_PKG.version || '1.0.0';

const TEMPLATE_DESCRIPTIONS = {
	default: 'Full-stack starter (React frontend + auth)',
	'api-rest': 'Backend-only REST API (auth + CRUD)',
	'saas-multitenant': 'Multi-tenant SaaS (orgs, roles) + dashboard',
	'realtime-chat': 'Authenticated real-time chat (Socket.IO) + UI',
};

// ---- helpers ----------------------------------------------------------------

function templateChoices() {
	const all = templateManager.getTemplates();
	// Show "default" first, then the rest.
	const ordered = ['default', ...all.filter((t) => t !== 'default')];
	return ordered
		.filter((t) => templateManager.exists(t))
		.map((t) => ({ title: t, value: t, description: TEMPLATE_DESCRIPTIONS[t] || '' }));
}

// Write every file of a template into the project, stripping the template-name
// prefix. Existing files are left untouched. Returns whether the template ships
// its own index.js. `exclude(rel)` can skip specific files.
function writeTemplateFiles(templateName, { exclude = () => false } = {}) {
	const files = templateManager.getTemplate(templateName);
	let hasIndex = false;
	for (const file of files) {
		const rel = file.route.split('/').slice(1).join('/');
		if (!rel || exclude(rel)) continue;
		if (rel === 'index.js') hasIndex = true;
		const dest = path.join(process.cwd(), rel);
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		if (!fs.existsSync(dest)) fs.writeFileSync(dest, file.content);
	}
	return { hasIndex };
}

// Merge KEY=VALUE pairs from a copied .env.example onto the generated .env so a
// template can override defaults (e.g. DISABLE_VITE=false).
function applyEnvOverridesFromExample(envPath) {
	const examplePath = path.join(process.cwd(), '.env.example');
	if (!fs.existsSync(examplePath)) return;
	for (const line of fs.readFileSync(examplePath, 'utf-8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (key) EnvManager.setEnvVariable(envPath, key, value);
	}
}

function writeDefaultIndex() {
	const indexContent = `const { Kernel } = require('zyket');

const kernel = new Kernel({
	services: [
		['auth', require('./src/services/auth'), ["@service_container"]],
	]
});

kernel.boot().then(() => {
    console.log('Kernel booted successfully!');
}).catch((error) => {
    console.error('Error booting kernel:', error);
});
`;
	fs.writeFileSync(path.join(process.cwd(), 'index.js'), indexContent);
}

function templateRoutes(name) {
	return templateManager.getTemplate(name).map((f) => f.route);
}

function templateHasFrontend(name) {
	return templateRoutes(name).some((r) => r.startsWith(`${name}/frontend/`));
}

function templateUsesAuth(name) {
	return templateRoutes(name).some((r) => r.startsWith(`${name}/src/services/auth/`));
}

// Build the dependency set a generated project needs. The user's own code
// (frontend configs, handlers, stores) imports these DIRECTLY, so they must be
// real project dependencies — not just transitive deps of zyket. Versions are
// pinned to whatever this zyket release uses.
function depsForTemplate(template) {
	const deps = { zyket: `^${ZYKET_VERSION}` };
	if (template === 'default') return deps; // default init is backend-only

	const copy = (names) => names.forEach((n) => {
		const v = ZYKET_PKG.dependencies?.[n];
		if (v) deps[n] = v;
	});

	if (templateUsesAuth(template)) copy(['better-auth']);
	if (templateHasFrontend(template)) {
		copy([
			'react', 'react-dom', 'react-router-dom', 'zustand', 'prop-types',
			'vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'tailwindcss',
		]);
	}
	if (template === 'realtime-chat') copy(['socket.io-client']);

	return deps;
}

function ensurePackageJson(template) {
	const packageJsonPath = path.join(process.cwd(), 'package.json');
	if (fs.existsSync(packageJsonPath)) return;
	const packageJson = {
		name: path.basename(process.cwd()),
		version: '1.0.0',
		description: 'Zyket application',
		main: 'index.js',
		scripts: { dev: 'node index.js' },
		keywords: [],
		author: '',
		license: 'ISC',
		dependencies: depsForTemplate(template),
	};
	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function npmInstall() {
	return new Promise((resolve, reject) => {
		const npmInstallProcess = spawn('npm', ['install'], { cwd: process.cwd(), stdio: 'inherit', shell: true });
		npmInstallProcess.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`npm install exited with code ${code}`));
		});
		npmInstallProcess.on('error', reject);
	});
}

// ---- main -------------------------------------------------------------------

(async () => {
	process.stdout.write("[2J[0;0H");
	await templateManager.boot();

	const args = process.argv.slice(2);
	const directCommand = args[0];

	let actionToRun = null;
	let templateArg = null;

	if (directCommand === 'init') {
		actionToRun = 'init-project';
		templateArg = args[1] || null; // e.g. `npx zyket init api-rest`
	} else {
		const response = await prompts({
			type: 'select',
			name: 'value',
			message: '[ZYKET] What do you want to do?',
			choices: [
				{ title: 'Initialize Project', value: 'init-project', description: 'Scaffold a new Zyket project from a template', disabled: false },
				{ title: 'Install Template', value: 'install-template', description: 'Add a template into the current project', disabled: false },
			],
			initial: 0,
		});
		actionToRun = response.value;
	}

	if (!actionToRun) {
		console.log('[ZYKET] No action selected. Exiting.');
		return;
	}

	const actions = {
		'init-project': async (preselectedTemplate) => {
			// Resolve which template to scaffold.
			let template = preselectedTemplate && templateManager.exists(preselectedTemplate) ? preselectedTemplate : null;
			if (preselectedTemplate && !template) {
				console.log(`[ZYKET] Template '${preselectedTemplate}' not found. Pick one:`);
			}
			if (!template) {
				const response = await prompts({
					type: 'select',
					name: 'value',
					message: '[ZYKET] Choose a template to initialize',
					choices: templateChoices(),
					initial: 0,
				});
				template = response.value;
			}

			if (!template) {
				console.log('[ZYKET] No template selected. Exiting.');
				return;
			}

			const indexPath = path.join(process.cwd(), 'index.js');
			const envPath = path.join(process.cwd(), '.env');

			if (fs.existsSync(indexPath)) {
				const overwrite = await prompts({
					type: 'confirm',
					name: 'value',
					message: '[ZYKET] index.js already exists. Continue scaffolding (existing files are kept)?',
					initial: false,
				});
				if (!overwrite.value) {
					console.log('[ZYKET] Initialization cancelled.');
					return;
				}
			}

			console.log(`[ZYKET] Initializing with template '${template}'...`);
			EnvManager.createEnvFile(envPath);

			if (template === 'default') {
				// Curated default: backend files only (no frontend, no socket guards/handlers).
				writeTemplateFiles('default', {
					exclude: (rel) => !(
						(rel.startsWith('src/') || rel.startsWith('config/')) &&
						!rel.startsWith('src/guards/') &&
						!rel.startsWith('src/handlers/')
					),
				});
				writeDefaultIndex();
			} else {
				// Self-contained template: copy everything (incl. its index.js and frontend).
				const { hasIndex } = writeTemplateFiles(template);
				applyEnvOverridesFromExample(envPath);
				if (!hasIndex) writeDefaultIndex();
			}

			ensurePackageJson(template);

			console.log('\n[ZYKET] Installing dependencies...');
			await npmInstall();

			console.log(`\n[ZYKET] ✅ Project initialized with template '${template}'!`);

			if (template === 'default') {
				// Preserve previous behavior: start immediately.
				console.log('\n[ZYKET] Starting project...\n');
				spawn('node', ['index.js'], { cwd: process.cwd(), stdio: 'inherit', shell: true })
					.on('error', (error) => console.error('[ZYKET] Error starting project:', error));
				return;
			}

			// Templates that ship auth need their tables created first.
			const usesAuth = fs.existsSync(path.join(process.cwd(), 'src', 'services', 'auth'));
			console.log('\nNext steps:');
			if (usesAuth) console.log('  npx @better-auth/cli migrate   # create the auth tables');
			console.log('  node index.js\n');
			if (fs.existsSync(path.join(process.cwd(), 'README.md'))) {
				console.log('See README.md for template-specific details.\n');
			}
		},

		'install-template': async () => {
			const templates = templateManager.getTemplates();
			const response = await prompts({
				type: 'select',
				name: 'templateToInstall',
				message: '[ZYKET] What template would you like to install?',
				choices: templates.map((template) => ({ title: template.toUpperCase(), value: template, description: TEMPLATE_DESCRIPTIONS[template] || '', disabled: false })),
				initial: 0,
			});
			if (!templateManager.exists(response.templateToInstall)) throw new Error(`Template ${response.templateToInstall} not found`);
			templateManager.installTemplate(response.templateToInstall);
		},
	};

	await actions[actionToRun](templateArg);
})();
