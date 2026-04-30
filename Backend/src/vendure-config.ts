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
import { compileUiExtensions } from '@vendure/ui-devkit/compiler';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { LanguageCode } from '@vendure/common/lib/generated-types';
import { RazorpayPlugin } from './plugins/razorpay-payment/razorpay-payment.plugin';
import {
    CancellationRequestPlugin,
} from './plugins/cancellation-request/cancellation-request.plugin';
import { OtpAuthPlugin } from './plugins/otp-auth/otp-auth.plugin';
import { otpEmailHandler } from './plugins/otp-auth/email-handler';


const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;



export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        cors: { 
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
            credentials: true,
        },
        trustProxy: IS_DEV ? false : 1,
        ...(IS_DEV
            ? {
                  adminApiDebug: true,
                  shopApiDebug: true,
              }
            : {}),
    },
    authOptions: {
        requireVerification: process.env.REQUIRE_VERIFICATION === 'true',
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
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: process.env.DB_LOGGING === 'true',
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA || 'public',
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' 
            ? {
                rejectUnauthorized: false
              }
            : false,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
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
                defaultValue: true,
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
    },
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, 'assets'),
            namingStrategy: new DefaultAssetNamingStrategy(),
            storageStrategyFactory: configureS3AssetStorage({
                bucket: (process.env.S3_BUCKET || 'bf-assets-8adm05') as string,
                credentials: fromEnv(),
                nativeS3Configuration: {
                    region: (process.env.AWS_REGION || 'us-east-1') as string,
                },
            }),
            assetUrlPrefix: process.env.ASSET_URL_PREFIX || `https://bf-assets-8adm05.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: IS_DEV,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: [
                defaultEmailHandlers,
                otpEmailHandler,
            ],
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: `"${process.env.NOREPLY_EMAIL_TITLE}" <${process.env.NOREPLY_EMAIL}>`,
                verifyEmailAddressUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify`,
                passwordResetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/password-reset`,
            },
            transport: IS_DEV ? undefined : {
                type: 'smtp',
                host: process.env.EMAIL_SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
                port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
                secure: process.env.EMAIL_SMTP_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_SMTP_USER,
                    pass: process.env.EMAIL_SMTP_PASSWORD,
                },
                logging: !IS_DEV,
                debug: !IS_DEV,
            },
        } as any),

        CancellationRequestPlugin.init({
            earlyCancellationHours: +(process.env.EARLY_CANCELLATION_HOURS || 4),
            postDeliveryCancellationDays: +(process.env.POST_DELIVERY_CANCELLATION_DAYS || 2),
        }),
     AdminUiPlugin.init({
            port: serverPort + 2,
            route: 'admin',

            app: IS_DEV
                ? compileUiExtensions({
                    outputPath: path.join(__dirname, '../admin-ui'),
                    extensions: [CancellationRequestPlugin.ui],
                    devMode: true,
                })
                : {
                    path: path.join(__dirname, '../admin-ui/dist/browser'),
                },

            adminUiConfig: {
                apiHost: IS_DEV ? undefined : 'auto',
                apiPort: IS_DEV ? serverPort : 'auto',
            },

            compatibilityMode: IS_DEV,
        }),

       
        RazorpayPlugin,
        OtpAuthPlugin,
    ],
};
