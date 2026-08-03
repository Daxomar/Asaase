const fs = require("fs");
const path = require("path");

const entitlementsPath = path.join(__dirname, "../ios/mobile/mobile.entitlements");

const emptyEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict/>
</plist>
`;

if (fs.existsSync(entitlementsPath)) {
  fs.writeFileSync(entitlementsPath, emptyEntitlements);
}
