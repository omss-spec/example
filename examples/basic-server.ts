import { OMSSServer, ProviderRegistry, ProviderRegistryConfig } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ quiet: true });

async function main() {
    //create registry config
    const conf: ProviderRegistryConfig = {
        proxyBaseUrl: process.env.PROXY_BASE_URL || undefined,
        host: process.env.PROXY_HOST || 'localhost',
        port: process.env.PROXY_PORT || 3000,
        protocol: process.env.PROXY_PROTOCOL === 'https' ? 'https' : 'http',
    };

    // Create provider registry
    const registry = new ProviderRegistry(conf);

    // Register your custom providers
    //    registry.register(new ExampleProvider());

    // Auto-discover providers from a directory (optional)
    await registry.discoverProviders('./examples/providers'); // <- the relative path from there where you run 'npm run <script>'!! most of the time it's the project root!

    // Create and start server
    const server = new OMSSServer(
        {
            name: 'My OMSS Backend',
            version: '1.0.0',
            port: parseInt(process.env.PORT || '3000', 10),
            host: process.env.HOST || '0.0.0.0',
            cache: {
                type: process.env.CACHE_TYPE === 'redis' ? 'redis' : 'memory',
                redis:
                    process.env.CACHE_TYPE === 'redis'
                        ? {
                              host: process.env.REDIS_HOST || 'localhost',
                              port: parseInt(process.env.REDIS_PORT || '6379', 10),
                              password: process.env.REDIS_PASSWORD,
                          }
                        : undefined,
                ttl: {
                    sources: 7200, // 2 hours
                    subtitles: 86400, // 24 hours
                },
            },
        },
        registry
    );

    // Handle graceful shutdown
    const shutdown = async () => {
        console.log('\n[Main] Received shutdown signal');
        await server.stop();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Start server
    await server.start();
}

// Run the server
main().catch((error) => {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
});
