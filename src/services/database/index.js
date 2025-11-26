const { Sequelize, Op } = require("sequelize");
const Service = require("../Service");
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

module.exports = class Database extends Service {
  #container;
  #databaseUrl;
  sequelize
  Op = Op;
  Sequelize = Sequelize;
  
  models = {}

  constructor(container, databaseUrl) {
    super('database');
    this.#container = container;
    this.#databaseUrl = databaseUrl;
  }
  
  async boot() {
    this.#createModelsFolder();
    this.sequelize = new Sequelize(this.#databaseUrl, {
      dialect: process.env.DATABASE_DIALECT || 'mariadb',
      logging: (msg) => this.#container.get('logger').debug(msg),
      operatorsAliases: 0,
      pool: {
        max: 40,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
    });

    await this.sequelize.authenticate();

    await this.#loadModels();
    
    this.#container.get('logger').debug(`Database modesl loaded: ${Object.keys(this.models).join(", ")}`);
  }

  async #loadModels() {
    const models = await fg('*.js', { cwd: path.join(process.cwd(), "src", "models") });
    for (const model of models) {
      const modelPath = path.join(process.cwd(), "src", "models", model);
      const modelFunc = require(modelPath);
      if (typeof modelFunc !== 'function') {
        this.#container.get('logger').error(`Model ${model} is not a function`);
        continue;
      }
      const modelInstance = modelFunc({sequelize: this.sequelize, container: this.#container, Sequelize});
      this.models[model.replace('.js', '')] = modelInstance;
    }

    for (const model of Object.values(this.models)) {
      if (model.associate) {
        model.associate(this.models);
      }
    }
  }

  async loadModel(model) {
    if (typeof model !== 'function') {
      this.#container.get('logger').error(`Model ${model} is not a function`);
      throw new Error(`Model ${model} is not a function`);
    }

    const modelInstance = model({sequelize: this.sequelize, container: this.#container, Sequelize});
    if(this.models[modelInstance.name]) {
      this.#container.get('logger').warn(`Model ${modelInstance.name} is already loaded, cannot load it again`);
      throw new Error(`Model ${modelInstance.name} is already loaded, cannot load it again`);
    }
    this.models[modelInstance.name] = modelInstance;

    if (modelInstance.associate) {
      modelInstance.associate(this.models);
    }
  }

  #createModelsFolder() {
    const path = 'src/models';
    if (!fs.existsSync(path)) fs.mkdirSync(path);
  }

  sync() {
    return this.sequelize.sync();
  }

}