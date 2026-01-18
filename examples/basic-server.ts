/**
 * OMSS Example Server - Comprehensive Configuration Guide
 *
 * This file demonstrates all available configuration options for
 * setting up an OMSS backend server.
 */

import { OMSSServer } from '../src/core/server';
import { ProviderRegistry } from '../src/providers/provider-registry';
import { ExampleProvider } from './providers/custom-provider';

// ============================================================================
// BASIC SETUP (Minimal Configuration)
// ============================================================================

async function basicSetup() {
    const server = new OMSSServer({
        // Required: Identify your server
        name: 'My OMSS Backend',
        version: '1.0.0',

        // Optional: Network configuration (defaults shown)
        host: 'localhost', // Interface to bind to
        port: 3000, // Port to listen on
    });

    // Register at least one provider
    const registry = server.getRegistry();
    registry.register(new ExampleProvider());

    // Start the server
    await server.start();

    console.log('✅ Basic server running on http://localhost:3000');
}

// ============================================================================
// DEVELOPMENT SETUP (With In-Memory Cache)
// ============================================================================

async function developmentSetup() {
    const server = new OMSSServer({
        name: 'OMSS Dev Server',
        version: '1.0.0',

        // Development network settings
        host: 'localhost',
        port: 3000,

        // In-memory cache (no external dependencies)
        cache: {
            type: 'memory',
            ttl: {
                sources: 3600,
                subtitles: 3600,
            }, // Cache for 1 hour (3600 seconds)
        },

        // TMDB configuration
        tmdb: {
            // Option 1: Provide API key here
            apiKey: process.env.TMDB_API_KEY ?? 'your_tmdb_api_key_here',

            // Option 2: Set TMDB_API_KEY environment variable
            // The server will automatically use it

            // How long to cache TMDB validation results
            cacheTTL: 86400, // 24 hours
        },
    });

    const registry = server.getRegistry();
    registry.register(new ExampleProvider());

    await server.start();
}

// ============================================================================
// PRODUCTION SETUP (With Redis Cache)
// ============================================================================

async function productionSetup() {
    const server = new OMSSServer({
        name: 'OMSS Production',
        version: '1.0.0',

        // Listen on all network interfaces
        host: '0.0.0.0',
        port: 3000,

        // Public URL for proxy generation
        // This is the URL clients will use to access your API
        publicUrl: 'https://api.mystream.com',

        // Redis cache configuration
        cache: {
            type: 'redis',
            ttl: {
                sources: 7200,
                subtitles: 7200,
            }, // Cache sources for 2 hours

            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),

                // Optional: Redis authentication
                password: process.env.REDIS_PASSWORD,
            },
        },

        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
            cacheTTL: 86400,
        },
    });

    const registry = server.getRegistry();

    // Register multiple providers
    registry.register(new ExampleProvider());
    // registry.register(new AnotherProvider());
    // registry.register(new YetAnotherProvider());

    await server.start();

    console.log('✅ Production server running');
}

// ============================================================================
// REVERSE PROXY SETUP (Behind Nginx/Apache/Traefik)
// ============================================================================

async function reverseProxySetup() {
    /**
     * Use this configuration when your OMSS server sits behind a reverse proxy.
     *
     * Example nginx config:
     *
     * location /api/ {
     *     proxy_pass http://localhost:3000/;
     *     proxy_set_header Host $host;
     *     proxy_set_header X-Real-IP $remote_addr;
     * }
     */

    const server = new OMSSServer({
        name: 'OMSS Behind Proxy',
        version: '1.0.0',

        // Bind to localhost (only accessible from proxy)
        host: '127.0.0.1',
        port: 3000,

        // Public URL is what clients see (through the proxy)
        publicUrl: 'https://myapp.com/api',

        cache: {
            type: 'redis',
            ttl: {
                sources: 7200,
                subtitles: 7200,
            },
            redis: {
                // Redis on same machine
                host: '127.0.0.1',
                port: 6379,
            },
        },

        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
        },
    });

    const registry = server.getRegistry();
    registry.register(new ExampleProvider());

    await server.start();
}

// ============================================================================
// DOCKER SETUP (Containerized Deployment)
// ============================================================================

async function dockerSetup() {
    /**
     * Use this for Docker deployments.
     *
     * Example docker-compose.yml:
     *
     * services:
     *   omss:
     *     build: .
     *     ports:
     *       - "3000:3000"
     *     environment:
     *       - TMDB_API_KEY=${TMDB_API_KEY}
     *       - REDIS_HOST=redis
     *       - PUBLIC_URL=https://api.example.com
     *     depends_on:
     *       - redis
     *
     *   redis:
     *     image: redis:alpine
     *     volumes:
     *       - redis_data:/data
     */

    const server = new OMSSServer({
        name: 'OMSS Docker',
        version: '1.0.0',

        // Docker containers should bind to all interfaces
        host: '0.0.0.0',
        port: parseInt(process.env.PORT || '3000'),

        // Public URL from environment variable
        publicUrl: process.env.PUBLIC_URL,

        cache: {
            type: 'redis',
            redis: {
                // Docker service name as hostname
                host: process.env.REDIS_HOST || 'redis',
                port: 6379,
            },
        },

        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
        },
    });

    const registry = server.getRegistry();
    registry.register(new ExampleProvider());

    await server.start();
}

// ============================================================================
// CUSTOM PROVIDER REGISTRY SETUP
// ============================================================================

async function customRegistrySetup() {
    /**
     * If you want more control over provider registration,
     * create a custom registry before initializing the server.
     */

    // Create registry with proxy configuration
    const registry = new ProviderRegistry({
        proxyBaseUrl: 'https://api.mystream.com',
        // or separate host/port:
        // host: 'api.mystream.com',
        // port: 443,
        // protocol: 'https',
    });

    // Register providers with custom priority
    const vixsrc = new ExampleProvider();
    registry.register(vixsrc);

    // You can also disable providers dynamically
    // vixsrc.disable();

    // Create server with custom registry
    const server = new OMSSServer(
        {
            name: 'Custom Registry Server',
            version: '1.0.0',
            port: 3000,
        },
        registry // Pass custom registry
    );

    await server.start();
}

// ============================================================================
// ENVIRONMENT-BASED SETUP (Recommended for Most Projects)
// ============================================================================

async function environmentBasedSetup() {
    /**
     * This is the recommended approach: use environment variables
     * for all configuration that changes between environments.
     *
     * Create a .env file:
     *
     * NODE_ENV=production
     * PORT=3000
     * HOST=0.0.0.0
     * PUBLIC_URL=https://api.mystream.com
     *
     * TMDB_API_KEY=your_key_here
     *
     * CACHE_TYPE=redis
     * CACHE_TTL=7200
     *
     * REDIS_HOST=localhost
     * REDIS_PORT=6379
     * REDIS_PASSWORD=
     * REDIS_DB=0
     */

    // Load environment variables
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const cacheType = (process.env.CACHE_TYPE as 'memory' | 'redis') || 'memory';

    const server = new OMSSServer({
        name: process.env.SERVER_NAME || 'OMSS Backend',
        version: process.env.npm_package_version || '1.0.0',

        host: process.env.HOST || (isDevelopment ? 'localhost' : '0.0.0.0'),
        port: parseInt(process.env.PORT || '3000'),
        publicUrl: process.env.PUBLIC_URL,

        cache: {
            type: cacheType,
            ttl: {
                sources: parseInt(process.env.CACHE_TTL || '7200'),
                subtitles: parseInt(process.env.CACHE_TTL || '7200'),
            },

            ...(cacheType === 'redis' && {
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
        },

        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
            cacheTTL: parseInt(process.env.TMDB_CACHE_TTL || '86400'),
        },
    });

    const registry = server.getRegistry();
    registry.register(new ExampleProvider());

    await server.start();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
}

// ============================================================================
// RUN THE EXAMPLE
// ============================================================================

// Uncomment the setup you want to try:

// basicSetup();
// developmentSetup();
// productionSetup();
// reverseProxySetup();
// dockerSetup();
// customRegistrySetup();
environmentBasedSetup(); // Recommended
