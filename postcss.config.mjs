/**
 * PostCSS configuration for styling transformations.
 *
 * Configures the Tailwind CSS PostCSS plugin (`@tailwindcss/postcss`) for Tailwind CSS v4.
 *
 * Notable: Automatically loaded by Next.js during build and CSS compilation.
 */

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
