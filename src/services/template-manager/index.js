const fg = require('fast-glob');
const Service = require('../Service');
const path = require('path');
const fs = require('fs');

module.exports = class TemplateManager extends Service {
  templates = {}

  constructor() {
    super('template-manager');
  }

  async boot() {
    const zyketTemplates = await fg(['**/*.js'], {
      cwd: path.join(__dirname, '../../templates'),
    });
    for (const template of zyketTemplates) {
      const templatePath = path.join(__dirname, '../../templates', template);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.templates[template.replace('.js', '')] = {
        route: template,
        content: templateContent
      };   
    }
  }

  installFile(fileName, location) {
    const template = this.templates[fileName];
    if (!template) throw new Error(`Template ${fileName} not found`);
    return fs.writeFileSync(location, template?.content);
  }

  installTemplate(templateName) {
    const template = this.getTemplates().find((t) => t === templateName);
    if (!template) throw new Error(`Template ${templateName} not found`);
    const files = this.getTemplate(templateName);
    
    for (const file of files) {
      const fileName = file?.route.split('/').slice(1).join('/');
      const fileLocation = path.join(process.cwd(), fileName);
      if (fs.existsSync(fileLocation)) throw new Error(`File ${file} already exists`);
    }

    for (const file of files) {
      const fileName = file?.route.split('/').slice(1).join('/');
      const fileLocation = path.join(process.cwd(), fileName);
      const folderLocation = path.join(process.cwd(), fileName.split('/').slice(0, -1).join('/'));
      fs.mkdirSync(folderLocation, { recursive: true });
      fs.writeFileSync(fileLocation, file?.content);
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
    return files.map((file) => this.templates[file]);
  }

  exists(templateName) {
    return this.getTemplates().some((t) => t === templateName);
  }
}