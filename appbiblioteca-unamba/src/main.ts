import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const isTestEnv = !!(globalThis as any).IS_TESTING_ENVIRONMENT;
if (!isTestEnv) {
	try {
		await bootstrapApplication(App, appConfig);
	} catch (err) {
		console.error(err);
	}
}