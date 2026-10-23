const patchedVersions = { ...process.versions, node: "20.10.0" };
try {
  Object.defineProperty(process, "versions", {
    value: patchedVersions,
    configurable: true,
    writable: true,
  });
} catch (e) {
  process.versions.node = "20.10.0";
}
try {
  Object.defineProperty(process, "version", {
    value: "v20.10.0",
    configurable: true,
    writable: true,
  });
} catch (e) {}

