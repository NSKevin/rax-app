const path = require('path');
const webpack = require('webpack');
const { RawSource } = require('webpack-sources');
const { existsSync, readFileSync, unlinkSync } = require('fs');
const { createElement } = require('rax');
const { renderToString } = require('rax-server-renderer');

const NAME = 'PWAAppShellPlugin';
const FILE_NAME = '__PWA_APP_SHELL__';

const interopRequire = (obj) => {
  return obj && obj.__esModule ? obj.default : obj;
};

// The App-Shell component will be pre-rendered to index.html.
// When user loaded entry javascript file, it will hydrate the App-Shell component.
module.exports = class PWAAppShellPlugin {
  constructor() {
    this.name = NAME;
  }

  apply(compiler) {
    let appConfig;
    const config = compiler.options;

    try {
      const appJSON = path.resolve(config.context, 'src/app.json');
      appConfig = JSON.parse(readFileSync(appJSON, 'utf-8'));
    } catch (e) {
      throw new Error('Please make sure your project has app.json!');
    }

    // Only Web projects are supported. Effective when the user set shell
    if (config.target !== 'web' || !appConfig.shell) return;

    // It's must have source config
    if (!appConfig.shell.source) {
      throw new Error('Please make sure shell config contains source!');
    }

    const file = path.resolve(config.context, `src/${appConfig.shell.source}`);
    // build/web/[FILE_NAME].js
    const outputFile = path.join(config.output.path, config.output.filename.replace('[name]', FILE_NAME));

    // Compile App-Shell
    compiler.hooks.beforeCompile.tapAsync(this.name, (compilationParams, callback) => {
      // externals rax, update libraryTarget, disabled self plugin
      const newConfig = {
        ...config,
        externals: {
          rax: 'rax',
        },
        entry: { [FILE_NAME]: [file] },
        output: {
          ...config.output,
          libraryTarget: 'commonjs2',
        },
        plugins: config.plugins.map((plugin) => {
          // disabled self plugin
          if (plugin.name === this.name) {
            return function () {
              // ignore
            };
          }
          return plugin;
        }),
      };
      webpack(newConfig).run(() => {
        callback();
      });
    });

    // Render into index.html
    compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {

      const AppShell = interopRequire(eval(`var window = {};${readFileSync(outputFile, 'utf-8')}`)); // eslint-disable-line
      const content = renderToString(createElement(AppShell, {}));

      // Pre-render App-Shell renderToString element to index.html
      const entryObj = compilation.options.entry;
      Object.keys(entryObj).forEach(entry => {
        const pageHtmlValue = compilation.assets[`web/${entry}.html`].source();
        compilation.assets[`web/${entry}.html`] = new RawSource(pageHtmlValue.replace(
          /<div(.*?) id="root">(.*?)<\/div>/,
          `<div id="root">${content}</div>`
        ));
      });
      callback();
    });

    // Delete temp files
    compiler.hooks.done.tap(this.name, () => {
      if (config.mode === 'production' || !config.mode) {
        const mapFile = `${outputFile}.map`;
        const htmlFile = outputFile.replace(/\.js$/, '.html');

        existsSync(outputFile) && unlinkSync(outputFile);
        existsSync(mapFile) && unlinkSync(mapFile);
        existsSync(htmlFile) && unlinkSync(htmlFile);
      }
    });
  }
};
