const exclusionListModule = require('metro-config/private/defaults/exclusionList');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const exclusionList = exclusionListModule.default ?? exclusionListModule;

config.resolver.blockList = exclusionList([/.*\.git.*/, /.*\.agents.*/]);

module.exports = config;
