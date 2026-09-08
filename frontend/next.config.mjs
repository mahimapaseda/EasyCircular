/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Required for Sign in with Google popups when FedCM is unavailable.
  // See: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
