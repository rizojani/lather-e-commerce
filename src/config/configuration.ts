export default () => {
    const appName = process.env.APP_NAME || 'File Management App';

    // Resolve email "from" name:
    // - Prefer MAIL_FROM_NAME when it's set and not literally '${APP_NAME}'
    // - Otherwise fall back to APP_NAME
    const mailFromNameEnv = process.env.MAIL_FROM_NAME;
    const resolvedFromName =
        mailFromNameEnv && mailFromNameEnv !== '${APP_NAME}'
            ? mailFromNameEnv
            : appName || 'Alonzo';

    return ({
        app: {
            name: appName,
            env: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT || '3000', 10),
            url: process.env.APP_URL || 'http://localhost:3000',
        },
        database: {
            mongodb: {
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/file-management',
            },
        },
        jwt: {
            secret: process.env.JWT_SECRET || 'default-jwt-secret',
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        },
        upload: {
            path: process.env.UPLOAD_PATH || './uploads',
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        },
        email: {
            // Use Laravel-style environment variables with fallbacks
            host: process.env.MAIL_HOST || process.env.EMAIL_HOST || 'smtppro.zoho.com',
            port: parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT || '587', 10),
            secure: process.env.MAIL_ENCRYPTION === 'ssl' || process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USERNAME || process.env.EMAIL_USER,
                pass: process.env.MAIL_PASSWORD || process.env.EMAIL_PASS,
            },
            from: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || 'custom-dev@onlinetestingserver.com',
            fromName: resolvedFromName,
        },
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            /** Stripe Node default is 80s; identity_document uploads often need longer (ms). */
            httpTimeoutMs: (() => {
                const n = parseInt(process.env.STRIPE_HTTP_TIMEOUT_MS || '180000', 10);
                return Number.isFinite(n) && n >= 30000 ? n : 180000;
            })(),
            /** Shown on Connect account business_profile[url] (trimmed; no wrapping quotes) */
            connectBusinessProfileUrl: (() => {
                const pick =
                    process.env.STRIPE_CONNECT_BUSINESS_PROFILE_URL?.trim() ||
                    process.env.BUSINESS_URL?.trim() ||
                    process.env.APP_URL?.trim();
                const cleaned = pick?.replace(/^["']|["']$/g, '').trim();
                return cleaned || 'https://stripe.com';
            })(),
            /** If true, UAE Connect onboarding uploads assets/business_card.png (slow; can hit HTTP timeouts). Default false. */
            uaeAttachAssetsTestDocument: process.env.STRIPE_UAE_ATTACH_ASSETS_DOCUMENT === 'true',
        },
        zoom: {
            apiKey: process.env.ZOOM_API_KEY,
            apiSecret: process.env.ZOOM_API_SECRET,
            accountId: process.env.ZOOM_ACCOUNT_ID,
        },
    });
}