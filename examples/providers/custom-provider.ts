/**
 * OMSS Provider Example - Complete Implementation Guide
 *
 * This file demonstrates how to create a custom provider that
 * scrapes streaming sources from any website and returns OMSS-compliant
 * responses.
 */

import { BaseProvider } from '../../src/providers/base-provider';
import { ProviderCapabilities, SourceType, ProviderMediaObject, ProviderResult, Source, Subtitle } from '../../src/core/types';
import axios from 'axios';

/**
 * Example Provider Implementation
 *
 * This provider demonstrates all required and optional features
 * for creating an OMSS-compliant content provider.
 */
export class ExampleProvider extends BaseProvider {
    // ========================================================================
    // REQUIRED PROPERTIES
    // ========================================================================

    /**
     * Unique identifier for this provider (lowercase, no spaces)
     * This will be used in source IDs and logging
     */
    readonly id = 'example-provider';

    /**
     * Human-readable name for this provider
     * This will appear in source metadata and logs
     */
    readonly name = 'Example Provider';

    /**
     * Whether this provider is enabled
     * Set to false to temporarily disable without removing manual registration/disabling automatic lookup
     */
    readonly enabled = true;

    /**
     * Base URL of the provider's website
     * Used for constructing API endpoints and as default referer
     */
    readonly BASE_URL = 'https://example.com';

    /**
     * Default HTTP headers for all requests
     * Most streaming sites require these to prevent blocking
     */
    readonly HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://example.com/',
        Origin: 'https://example.com',

        // Some sites also require:
        // 'X-Requested-With': 'XMLHttpRequest',
        // 'Sec-Fetch-Dest': 'empty',
        // 'Sec-Fetch-Mode': 'cors',
        // 'Sec-Fetch-Site': 'same-origin',
    };

    /**
     * Declare what types of content this provider supports
     *
     * Options:
     * - 'movies': Provider can fetch movie sources
     * - 'tv': Provider can fetch TV episode sources
     * - 'sub': Provider offers subtitle-only sources
     */
    readonly capabilities: ProviderCapabilities = {
        supportedContentTypes: ['movies', 'tv'],

        // If your provider only supports movies:
        // supportedContentTypes: ['movies'],

        // If your provider only supports TV:
        // supportedContentTypes: ['tv'],

        // If your provider offers subtitle-only sources:
        // supportedContentTypes: ['movies', 'tv', 'sub'],
    };

    // ========================================================================
    // REQUIRED METHODS
    // ========================================================================

    /**
     * Fetch streaming sources for a movie
     *
     * @param media - Media object containing TMDB ID, title, year, etc. see ProviderMediaObject in @/core/types.ts
     * @returns ProviderResult with sources, subtitles, and diagnostics
     */
    async getMovieSources(media: ProviderMediaObject): Promise<ProviderResult> {
        // the folllowing is a step-by-step example implementation.
        // Log that we're starting (automatically includes context in dev mode)
        this.console.log('Fetching movie sources', media);

        try {
            // Step 1: Build the URL to scrape
            const searchUrl = `${this.BASE_URL}/api/search?tmdb=${media.tmdbId}&type=movie`;
            this.console.debug('Searching for movie', { url: searchUrl }, media);

            // Step 2: Fetch the search results
            const searchResponse = await axios.get(searchUrl, {
                headers: this.HEADERS,
                timeout: 10000,
            });

            // Step 3: Extract the stream URL from the response this is only an example
            const streamUrl = searchResponse.data?.streamUrl;
            if (!streamUrl) {
                this.console.warn('No stream URL found', media);
                return this.emptyResult('No stream URL in response');
            }

            this.console.debug('Found stream URL', { url: streamUrl }, media);

            // Step 4: Fetch the HLS manifest (if needed)
            const manifestResponse = await axios.get(streamUrl, {
                headers: {
                    ...this.HEADERS,
                    Referer: `${this.BASE_URL}/movie/${media.tmdbId}`,
                },
                timeout: 10000,
            });

            const manifest = manifestResponse.data;

            // Step 5: Parse audio tracks (if HLS)
            const audioTracks = this.parseAudioTracks(manifest, media); // some private helper method
            this.console.debug('Parsed audio tracks', { count: audioTracks.length }, media);

            // Step 6: Parse subtitles (if available)
            const subtitles = this.parseSubtitles(manifest, media); // some private helper method
            this.console.debug('Parsed subtitles', { count: subtitles.length }, media);

            // Step 7: Create source object
            const sources: Source[] = [
                {
                    // IMPORTANT: Always use createProxyUrl() to wrap streaming URLs
                    // This ensures proper header forwarding and CORS handling
                    url: this.createProxyUrl(streamUrl, {
                        ...this.HEADERS,
                        Referer: `${this.BASE_URL}/movie/${media.tmdbId}`,
                    }),

                    // Stream type: 'hls', 'dash', 'mp4', 'mkv', 'webm', 'embed'
                    type: this.inferType(streamUrl) as SourceType,

                    // Quality: '2160p', '1080p', '720p', '480p', '360p', 'unknown'
                    quality: this.inferQuality(streamUrl),

                    // Audio tracks
                    audioTracks:
                        audioTracks.length > 0
                            ? audioTracks
                            : [
                                  {
                                      language: 'en',
                                      label: 'English',
                                  },
                              ],

                    // Provider attribution
                    provider: {
                        id: this.id,
                        name: this.name,
                    },
                },
            ];

            // Step 8: Success!
            this.console.success(`Found ${sources.length} source(s), ${subtitles.length} subtitle(s)`, media);

            return {
                sources,
                subtitles,
                diagnostics: [],
            };
        } catch (error) {
            // Log the error with full context
            this.console.error('Failed to fetch movie sources', error, media);

            // Return empty result with diagnostic
            return this.emptyResult(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Fetch streaming sources for a TV episode
     *
     * @param media - Media object with TMDB ID, season, episode, title, etc.
     * @returns ProviderResult with sources, subtitles, and diagnostics
     */
    async getTVSources(media: ProviderMediaObject): Promise<ProviderResult> {
        // basically the same as getMovieSources, but adapted for TV episodes
        return this.emptyResult('TV source fetching not implemented yet');
    }

    // ========================================================================
    // OPTIONAL METHODS
    // ========================================================================

    /**
     * Health check to verify provider is accessible
     * Override this if you want custom health check logic. This is the default implementation:
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.head(this.BASE_URL, {
                headers: this.HEADERS,
                timeout: 5000,
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    /**
     * Return empty result with diagnostic message
     */
    private emptyResult(message: string): ProviderResult {
        return {
            sources: [],
            subtitles: [],
            diagnostics: [
                {
                    code: 'PROVIDER_ERROR',
                    message: `${this.name}: ${message}`,
                    field: '',
                    severity: 'error',
                },
            ],
        };
    }
}

// ============================================================================
// CONSOLE LOGGING EXAMPLES
// ============================================================================

/**
 * The BaseProvider includes a context-aware console wrapper.
 *
 * Available methods:
 * - this.console.log(message, media?)     - General logging (dev only)
 * - this.console.info(message, media?)    - Info logging (always shown)
 * - this.console.warn(message, media?)    - Warnings (always shown)
 * - this.console.error(msg, error, media?) - Errors (always shown)
 * - this.console.debug(msg, data, media?) - Debug with data (dev only)
 * - this.console.success(message, media?) - Success messages (dev only)
 *
 * Development output example:
 * [Example Provider] [example-provider] [Movie: 550] [Fight Club] Fetching movie sources
 * [Example Provider] [example-provider] [Movie: 550] [Fight Club] 🔍 Searching for movie { url: '...' }
 * [Example Provider] [example-provider] [Movie: 550] [Fight Club] ✅ Found 1 source(s), 3 subtitle(s)
 *
 * Production output example:
 * [Example Provider] Fetching movie sources
 * [Example Provider] Found 1 source(s), 3 subtitle(s)
 */

// ============================================================================
// BUILT-IN HELPER METHODS
// ============================================================================

/**
 * BaseProvider provides several useful helper methods:
 *
 * 1. createProxyUrl(url, headers?)
 *    - Wraps streaming URL with proxy endpoint
 *    - Automatically includes server hostname/port
 *    - Example: this.createProxyUrl(streamUrl, { 'Referer': '...' })
 *
 * 2. inferQuality(filename)
 *    - Detects quality from URL or filename
 *    - Returns: '2160p', '1080p', '720p', '480p', '360p', 'unknown'
 *    - Example: this.inferQuality('video_1080p.m3u8') // '1080p'
 *
 * 3. inferType(url)
 *    - Detects stream type from URL extension
 *    - Returns: 'hls', 'dash', 'mp4', 'mkv', 'webm', 'embed'
 *    - Example: this.inferType('playlist.m3u8') // 'hls'
 *
 * 4. supportsContentType(type)
 *    - Check if provider supports 'movies', 'tv', or 'sub'
 *    - Example: if (this.supportsContentType('movies')) { ... }
 */

// ============================================================================
// REGISTRATION EXAMPLE
// ============================================================================

/**
 * To use your custom provider:
 *
 * use registry.discoverProviders('./path/to/providers') to auto-load all providers from a directory. This is relative from where you start the server.
 *
 * // or manually register it:
 *
 * import { ProviderRegistry } from './src/providers/provider-registry';
 * import { ExampleProvider } from './providers/example-provider';
 *
 * const registry = new ProviderRegistry();
 * registry.register(new ExampleProvider());
 *
 * // Or with server:
 * const server = new OMSSServer(config);
 * server.getRegistry().register(new ExampleProvider());
 */
