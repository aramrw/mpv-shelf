/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    reactStrictMode: false,
    images: {
        unoptimized: true,
    },
    // experimental: {
    //     scrollRestoration: true,
    // }
};

export default nextConfig;
