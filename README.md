# OMSS Backend

A TypeScript implementation of the [OMSS (Open Media Streaming Specification)](https://github.com/omss-spec/omss-spec) with a pluggable provider system.

## Features

- ✅ Full OMSS v1.0 compliance
- 🔌 Pluggable provider architecture
- 🚀 High performance with Fastify
- 💾 Built-in caching (Memory/Redis)
- 📝 TypeScript with full type safety
- 🛠️ Easy to extend and customize

## Installation

```bash
npm install omss-backend
```

## Quick Start

```typescript
import { OMSSServer, ProviderRegistry, BaseProvider } from 'omss-backend';

// Create a custom provider
class MyProvider extends BaseProvider {
    readonly id = 'my-provider';
    readonly name = 'My Provider';
    readonly priority = 10;

    async getMovieSources(tmdbId: string) {
        // Your scraping logic here
        return { sources: [], subtitles: [], diagnostics: [] };
    }

    async getTVSources(tmdbId: string, season: number, episode: number) {
        // Your scraping logic here
        return { sources: [], subtitles: [], diagnostics: [] };
    }
}

// Setup and start server
const registry = new ProviderRegistry();
registry.register(new MyProvider());

const server = new OMSSServer(
    {
        name: 'My OMSS Backend',
        version: '1.0.0',
        port: 3000,
    },
    registry
);

await server.start();
```

## Documentation

See the [examples](./examples) directory for more detailed usage examples.

## License

MIT

````

***

## **Final Step: Usage Summary**

You now have a complete OMSS backend package! Here's how users will use it:

```typescript
import { OMSSServer, ProviderRegistry } from 'omss-backend';
import { ExampleProvider } from './providers/example-provider';

const registry = new ProviderRegistry();

// Register providers
registry.register(new ExampleProvider());

// Auto-discover custom providers
await registry.discoverProviders('./providers');

// Start server
const server = new OMSSServer({
  name: 'My OMSS Backend',
  version: '1.0.0',
  port: 3000,
  cache: { type: 'memory' }
}, registry);

await server.start();
````

**Your package is now complete!** 🎉

To publish to npm:

```bash
npm run build
npm publish
```
