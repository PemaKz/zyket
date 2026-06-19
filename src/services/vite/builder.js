const path = require("path");

/**
 * Builds the Vite frontend for production using Vite's JS API.
 *
 * @param {Object} options
 * @param {string} options.root        Absolute path to the Vite project root.
 * @param {string|false} options.configFile  Resolved vite config file, or false.
 * @returns {Promise<string>} Absolute path to the generated output directory.
 */
module.exports = async function buildViteApp({ root, configFile } = {}) {
  const { build, resolveConfig } = await import("vite");

  // Resolve config first so we know the real outDir (respects custom config).
  const resolved = await resolveConfig(
    { root, configFile },
    "build",
    "production"
  );
  const outDir = path.resolve(root, resolved.build.outDir);

  await build({
    root,
    configFile,
    logLevel: "warn",
  });

  return outDir;
};
