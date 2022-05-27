const setMPAConfig = require('@builder/mpa-config');
const { getMpaEntries } = require('@builder/app-helpers');
const setEntry = require('./setEntry');
const { GET_RAX_APP_WEBPACK_CONFIG } = require('./constants');

module.exports = (api) => {
  const { getValue, context, registerTask, onGetWebpackConfig } = api;
  const { userConfig, command } = context;

  const getWebpackBase = getValue(GET_RAX_APP_WEBPACK_CONFIG);
  const tempDir = getValue('TEMP_PATH');
  const target = 'nativejs';
  const chainConfig = getWebpackBase(api, {
    target: 'nativejs',
    babelConfigOptions: { styleSheet: true },
    progressOptions: {
      name: 'nativejs',
    },
  });
  chainConfig.taskName = target;

  setEntry(chainConfig, context);

  chainConfig.name(target);
  registerTask(target, chainConfig);

  onGetWebpackConfig(target, (config) => {
    const { nativejs = {} } = userConfig;
    const staticConfig = getValue('staticConfig');
    // set mpa config
    if (nativejs.mpa) {
      setMPAConfig.default(api, config, {
        context,
        targetDir: tempDir,
        type: 'nativejs',
        entries: getMpaEntries(api, {
          target,
          appJsonContent: staticConfig,
        }),
      });
    }

    // NSK Disable this
    // if (command === 'start') {
    //   // Add webpack hot dev client
    //   Object.keys(config.entryPoints.entries()).forEach((entryName) => {
    //     config.entry(entryName).prepend(require.resolve('react-dev-utils/webpackHotDevClient'));
    //   });
    // }
  });
};
