"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const compiler_1 = require("@vendure/ui-devkit/compiler");
const cancellation_request_plugin_1 = require("./plugins/cancellation-request/cancellation-request.plugin");
async function main() {
    try {
        const compiler = (0, compiler_1.compileUiExtensions)({
            outputPath: path_1.default.join(__dirname, '../admin-ui'),
            extensions: [cancellation_request_plugin_1.CancellationRequestPlugin.ui],
            devMode: false,
        });
        if (compiler.compile) {
            await compiler.compile();
        }
        console.log('Admin UI extensions compiled successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Failed to compile Admin UI extensions:', error);
        process.exit(1);
    }
}
main();
