const fg = require('fast-glob');
const Service = require('../Service');
const path = require('path');
const fs = require('fs');

module.exports = class TemplateManager extends Service {
  #container;
  templates = {}

  constructor(container) {
    super('template-manager');
    this.#container = container;
  }

  async boot() {
    const zyketTemplates = await fg(['**/*.js'], {
      cwd: path.join(__dirname, '../../templates'),
    });
    for (const template of zyketTemplates) {
      // need to copy full file  and relation with the name on templates variable
      const templatePath = path.join(__dirname, '../../templates', template);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.templates[template.replace('.js', '')] = templateContent;   
    }

    this.#container.get('logger').info(`Loaded ${this.templates.length} templates`);
  }

  installFile(fileName, location) {
    const template = this.templates[fileName];
    if (!template) throw new Error(`Template ${fileName} not found`);
    return fs.writeFileSync(location, template);
  }

  installTemplate(templateName) {
    const template = this.getTemplates().find((t) => t === templateName);
    if (!template) throw new Error(`Template ${templateName} not found`);
    const files = this.getTemplate(templateName);
    
    for (const file of files) {
      const fileName = file.split('/').slice(1).join('/');
      const fileLocation = path.join(process.cwd(), fileName);
      if (fs.existsSync(fileLocation)) throw new Error(`File ${file} already exists`);
    }

    for (const file of files) {
      const fileName = file.split('/').slice(1).join('/');
      const template = this.templates[file];
      const fileLocation = path.join(process.cwd(), fileName);
      fs.writeFileSync(fileLocation, template);
    }
  }

  getTemplates() {
    const uniqueTemplates = new Set();
    for (const template of Object.keys(this.templates)) {
      uniqueTemplates.add(template.split('/')[0]);
    }
    return Array.from(uniqueTemplates);
  }

  getTemplate(templateName) {
    const files = Object.keys(this.templates).filter((t) => t.startsWith(templateName));
    if (files.length === 0) throw new Error(`Template ${templateName} not found`);
    return files
  }
}