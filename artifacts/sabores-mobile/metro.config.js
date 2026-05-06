const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const existingBlockList = config.resolver.blockList;
const existingPatterns = existingBlockList
  ? Array.isArray(existingBlockList)
    ? existingBlockList
    : [existingBlockList]
  : [];

config.resolver.blockList = [
  ...existingPatterns,
  /.*\/gaxios_tmp_.*/,
  /.*_tmp_\d+.*/,
];

module.exports = config;
