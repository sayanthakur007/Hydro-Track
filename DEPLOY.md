# Deploy HydroTrack to Netlify

This is a Next.js app with API routes, so deploy it as a connected Git repository. A drag-and-drop upload of static build files will not include the server-side routes needed for registration, login, and hydration data.

1. Push the project to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. Netlify reads `netlify.toml` and runs `npm run build` with Node.js 22. Keep the Next.js framework/runtime integration enabled; it handles the app's API routes.
4. Deploy the site and open the generated Netlify URL.

`next.config.ts` uses Netlify's standard Next.js output on Netlify builds and keeps standalone output for Docker builds.

## Important: persistence

The current `src/db/index.ts` is an in-memory compatibility shim. Account and hydration data are not durable and may disappear when server functions restart or run in separate instances. Setting `DATABASE_URL` alone will not enable PostgreSQL. Replace the shim with a real PostgreSQL/Drizzle connection and configure migrations before using the deployed app for real user data.
