// Expo Router requires a platform-extension-free fallback file to exist alongside
// index.native.tsx / index.web.tsx for its route manifest — Metro still resolves to
// the platform-specific file at runtime whenever one matches, so this is only ever
// reached in a context where neither does.
export { default } from "./index.native";
