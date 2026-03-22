const Service = require("../Service");
const path = require("path");
const fs = require("fs");

module.exports = class Vite extends Service {
  #container;
  #viteServer;
  #root;
  #port;

  constructor(container, root, port) {
    super("vite");
    this.#container = container;
    this.#root = path.resolve(process.cwd(), root || process.cwd());
    this.#port = port || 5173;
  }

  async boot() {
    await this.#loadViteFolder();
    const { createServer } = await import("vite");

    const configFile = this.#resolveConfigFile();

    this.#viteServer = await createServer({
      root: this.#root,
      configFile,
      server: {
        port: this.#port,
        strictPort: false,
      },
    });

    await this.#viteServer.listen();

    const resolvedPort = this.#viteServer.httpServer?.address()?.port ?? this.#port;
    this.#container.get("logger").info(
      `Vite dev server running on http://localhost:${resolvedPort} (root: ${this.#viteServer.config.root})`
    );
  }

  #resolveConfigFile() {
    const candidates = ["vite.config.js", "vite.config.ts", "vite.config.mjs"];
    for (const candidate of candidates) {
      const fullPath = path.join(this.#root, candidate);
      if (fs.existsSync(fullPath)) return fullPath;
    }
    return false;
  }

  async #loadViteFolder() {
    // exists folder named procces.env.VITE_ROOT in root of project, if not create it and add index.html and main.jsx
    const viteRoot = path.join(process.cwd(), process.env.VITE_ROOT || "frontend");
    
    if (!fs.existsSync(viteRoot)) fs.mkdirSync(viteRoot, { recursive: true });

    if (!fs.existsSync(path.join(viteRoot, "index.html"))) {
      this.#container.get('template-manager').installFile('default/frontend/index', path.join(process.cwd(), process.env.VITE_ROOT || "frontend", "index.html"));
    }

    if (!fs.existsSync(path.join(viteRoot, "main.jsx"))) {
      this.#container.get('template-manager').installFile('default/frontend/main', path.join(process.cwd(), process.env.VITE_ROOT || "frontend", "main.jsx"));
    }
    
    if (!fs.existsSync(path.join(viteRoot, "vite.config.js"))) {
      this.#container.get('template-manager').installFile('default/frontend/vite.config', path.join(process.cwd(), process.env.VITE_ROOT || "frontend", "vite.config.js"));
    }

    if (!fs.existsSync(path.join(viteRoot, "styles.css"))) {
      this.#container.get('template-manager').installFile('default/frontend/styles', path.join(process.cwd(), process.env.VITE_ROOT || "frontend", "styles.css"));
    }
  }

  server() {
    return this.#viteServer;
  }
};
