const {
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.26.102.2</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>
`;

/**
 * Plugin de Expo para Android que:
 * 1. Crea res/xml/network_security_config.xml permitiendo cleartext HTTP a la IP del servidor.
 * 2. Asigna android:networkSecurityConfig="@xml/network_security_config" y android:usesCleartextTraffic="true"
 *    en AndroidManifest.xml.
 */
module.exports = function withCleartextTraffic(config) {
  // Paso 1: Modificar AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    if (application) {
      application.$["android:usesCleartextTraffic"] = "true";
      application.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }

    return config;
  });

  // Paso 2: Crear el archivo res/xml/network_security_config.xml
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const resXmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml"
      );

      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }

      const xmlFilePath = path.join(resXmlDir, "network_security_config.xml");
      fs.writeFileSync(xmlFilePath, NETWORK_SECURITY_CONFIG.trim());

      return config;
    },
  ]);

  return config;
};
