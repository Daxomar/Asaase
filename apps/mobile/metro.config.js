const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// tslib's package.json "exports" map has separate "module"/"import" (real ESM,
// no default export) vs "default" (CJS) entries. For the web SSR/route-validation
// bundle (transform.environment=node), Metro's active condition set ends up
// matching the ESM branch, which has no `default` export - crashing any
// transitive dep compiled with esModuleInterop that expects `require("tslib")`
// to hand back the CJS object. Force the bare `tslib` specifier to always
// resolve to its real CJS entry (tslib.js), regardless of platform/environment
// conditions, so every consumer gets the same object everywhere.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    const tslibCjsEntry = require.resolve("tslib/tslib.js", {
      paths: [path.dirname(context.originModulePath)],
    });
    return { type: "sourceFile", filePath: tslibCjsEntry };
  }
  // ponytail: moti hoists react@19.2.x from dashboard; mobile uses 19.1.x — dup React.
  if (
    moduleName === "react" ||
    moduleName === "react-dom" ||
    moduleName === "react/jsx-runtime" ||
    moduleName === "react/jsx-dev-runtime"
  ) {
    return {
      type: "sourceFile",
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
