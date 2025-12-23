import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { DefaultAssetNamingStrategy } from '@vendure/core';
import { fromEnv } from '@aws-sdk/credential-providers';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { LanguageCode } from '@vendure/common/lib/generated-types';
import { RazorpayPlugin } from './plugins/razorpay-payment/razorpay-payment.plugin';
import { CancellationRequestPlugin } from './plugins/cancellation-request/cancellation-request.plugin';
import { compileUiExtensions } from '@vendure/ui-devkit/compiler';
import { RequestContext } from '@vendure/core';


const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        requireVerification: true,
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
         Collection: [
           {
                name: 'externalLink',
                type: 'string',
                label: [{ languageCode: 'en' as LanguageCode, value: 'External Link' }],
                ui: { component: 'url-form-input' },
                nullable: true,
                description: [{ languageCode: 'en' as LanguageCode, value: 'External Link' }],
            },
            {
                name: 'componentName',
                type: 'string',
                label: [{ languageCode: 'en' as LanguageCode, value: 'Component Name' }],
                ui: { component: 'text-form-input' },
                nullable: true,
            },
            {
                name: 'isProductCollection',
                type: 'boolean',
                label: [{ languageCode: 'en' as LanguageCode, value: 'Is Product Collection' }],
                description: [{ languageCode: 'en' as LanguageCode, value: 'Check if this collection contains products. Uncheck if used for content management only.' }],
                ui: { component: 'boolean-form-input' },
                defaultValue: true,  // Default to true (is a product collection)
            },
        ],
         ProductOptionGroup: [
            {
                name: 'isParentGroup',
                type: 'boolean',
                defaultValue: false,
                label: [
                { languageCode: LanguageCode.en, value: 'Is Parent Group' }
                ],
            },
        ],
        Order: [
            {
                name: 'razorpayOrderId',
                type: 'string',
                nullable: true,
            },
        ],
    },
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, 'assets'),
            namingStrategy: new DefaultAssetNamingStrategy(),
            storageStrategyFactory: configureS3AssetStorage({
                bucket: 'bf-assets-8adm05',
                credentials: fromEnv(),
                nativeS3Configuration: {
                    region: process.env.AWS_REGION,
                },
            }),
            assetUrlPrefix: `https://bf-assets-8adm05.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:5173/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
      CancellationRequestPlugin.init({
        earlyCancellationHours: 4, // 4 hours after order placement
        postDeliveryCancellationDays: 2, // 2 days after delivery
        }),

        AdminUiPlugin.init({
                route: 'admin',
                port: serverPort + 2,
                app: compileUiExtensions({
                    outputPath: path.join(__dirname, '../admin-ui'),
                    extensions: [
                        CancellationRequestPlugin.ui,
                    ],
                    devMode: true,
                }),
                adminUiConfig: {
                    apiPort: serverPort,
                },
                compatibilityMode: true,
            }),

        RazorpayPlugin,
        
    ],
};
