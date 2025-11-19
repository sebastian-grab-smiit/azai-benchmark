// next.config.mjs
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
// If deploying to a project page: https://<user>.github.io/<repo>
// set basePath to '/<repo-name>' for production.
const basePath = ''

export default {
  output: 'export',           // writes to /out on build
  images: { unoptimized: true },
  basePath,                   // <-- set if using project pages
  assetPrefix: basePath,      // keeps asset URLs working
  trailingSlash: true,        // avoids 404s on GH Pages
}
