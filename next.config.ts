import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/data-sources',
        destination: '/lead-sources',
        permanent: true, // 301 redirect
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add resolve aliases to ensure proper module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Suppress specific warnings
    config.ignoreWarnings = [
      {
        module: /node_modules\/@opentelemetry\/instrumentation/,
      },
      {
        module: /node_modules\/handlebars/,
      },
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        http2: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        'node:events': false,
        'node:process': false,
        'node:stream': false,
        'node:util': false,
        'node:buffer': false,
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:http': false,
        'node:https': false,
        'node:url': false,
        'node:querystring': false,
        'node:os': false,
        'node:zlib': false,
      };
      
      config.externals = config.externals || [];
      config.externals.push({
        '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
        'handlebars': 'commonjs handlebars',
        'firebase-admin': 'commonjs firebase-admin',
      });
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
