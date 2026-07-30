import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';

import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { ConfirmationService, MessageService } from 'primeng/api';

const MyCustomPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{slate.50}',
            100: '{slate.100}',
            200: '{slate.200}',
            300: '{slate.300}',
            400: '{slate.400}',
            500: '{indigo.600}',
            600: '{indigo.500}',
            700: '{indigo.400}',
            800: '{indigo.300}',
            900: '{indigo.200}',
            950: '{indigo.100}'
        }
    }
});

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideHttpClient(),
		providePrimeNG({
            theme: {
                preset: MyCustomPreset,
				options: {
					darkModeSelector: '.my-app-dark'
				}
            }
        }),
		MessageService,
        ConfirmationService
	]
};