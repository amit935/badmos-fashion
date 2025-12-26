"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const core_1 = require("@vendure/core");
const email_plugin_1 = require("@vendure/email-plugin");
const asset_server_plugin_1 = require("@vendure/asset-server-plugin");
const core_2 = require("@vendure/core");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const admin_ui_plugin_1 = require("@vendure/admin-ui-plugin");
const compiler_1 = require("@vendure/ui-devkit/compiler");
const graphiql_plugin_1 = require("@vendure/graphiql-plugin");
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const generated_types_1 = require("@vendure/common/lib/generated-types");
const razorpay_payment_plugin_1 = require("./plugins/razorpay-payment/razorpay-payment.plugin");
const cancellation_request_plugin_1 = require("./plugins/cancellation-request/cancellation-request.plugin");
const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;
exports.config = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        ...(IS_DEV
            ? {
                adminApiDebug: true,
                shopApiDebug: true,
            }
            : {}),
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
        synchronize: false,
        migrations: [path_1.default.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [core_1.dummyPaymentHandler],
    },
    customFields: {
        Collection: [
            {
                name: 'externalLink',
                type: 'string',
                label: [{ languageCode: 'en', value: 'External Link' }],
                ui: { component: 'url-form-input' },
                nullable: true,
                description: [{ languageCode: 'en', value: 'External Link' }],
            },
            {
                name: 'componentName',
                type: 'string',
                label: [{ languageCode: 'en', value: 'Component Name' }],
                ui: { component: 'text-form-input' },
                nullable: true,
            },
            {
                name: 'isProductCollection',
                type: 'boolean',
                label: [{ languageCode: 'en', value: 'Is Product Collection' }],
                description: [{ languageCode: 'en', value: 'Check if this collection contains products. Uncheck if used for content management only.' }],
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
                    { languageCode: generated_types_1.LanguageCode.en, value: 'Is Parent Group' }
                ],
            },
        ],
    },
    plugins: [
        graphiql_plugin_1.GraphiqlPlugin.init(),
        asset_server_plugin_1.AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path_1.default.join(__dirname, 'assets'),
            namingStrategy: new core_2.DefaultAssetNamingStrategy(),
            storageStrategyFactory: (0, asset_server_plugin_1.configureS3AssetStorage)({
                bucket: 'bf-assets-8adm05',
                credentials: (0, credential_providers_1.fromEnv)(),
                nativeS3Configuration: {
                    region: process.env.AWS_REGION,
                },
            }),
            assetUrlPrefix: `https://bf-assets-8adm05.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`,
        }),
        core_1.DefaultSchedulerPlugin.init(),
        core_1.DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        core_1.DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        email_plugin_1.EmailPlugin.init({
            devMode: true,
            outputPath: path_1.default.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: email_plugin_1.defaultEmailHandlers,
            templateLoader: new email_plugin_1.FileBasedTemplateLoader(path_1.default.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:5173/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
        cancellation_request_plugin_1.CancellationRequestPlugin.init({
            earlyCancellationHours: 4,
            postDeliveryCancellationDays: 2,
        }),
        admin_ui_plugin_1.AdminUiPlugin.init({
            port: serverPort + 2,
            route: 'admin',
            app: IS_DEV
                ? (0, compiler_1.compileUiExtensions)({
                    outputPath: path_1.default.join(__dirname, '../admin-ui'),
                    extensions: [cancellation_request_plugin_1.CancellationRequestPlugin.ui],
                    devMode: true,
                })
                : {
                    path: path_1.default.join(__dirname, '../admin-ui/dist/browser'),
                },
            adminUiConfig: {
                apiPort: serverPort,
            },
            compatibilityMode: IS_DEV,
        }),
        razorpay_payment_plugin_1.RazorpayPlugin,
    ],
};
