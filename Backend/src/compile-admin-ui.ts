import path from 'path';
import { compileUiExtensions } from '@vendure/ui-devkit/compiler';
import { CancellationRequestPlugin } from './plugins/cancellation-request/cancellation-request.plugin';

async function main() {
  try {
    const compiler = compileUiExtensions({
      outputPath: path.join(__dirname, '../admin-ui'),
      extensions: [CancellationRequestPlugin.ui],
      devMode: false,
    });
    
    if (compiler.compile) {
      await compiler.compile();
    }
    
    console.log('Admin UI extensions compiled successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to compile Admin UI extensions:', error);
    process.exit(1);
  }
}

main();
