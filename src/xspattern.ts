declare var window;

// This file is only used in the built version of FontoXPath. See the import of xspattern in the
// wrapper in build.js for the require there. In unit tests, the import is rewritten using tsconfig
// to xspattern from node_modules.
export const compile = window['xspattern']['compile'];
