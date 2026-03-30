# 🌊 SeaSee-R: Immersive ROV Mapping

An immersive 3D visualization platform for underwater ROV (Remotely Operated Vehicle) panoramic imagery, built with Next.js and Three.js. This application provides interactive spherical panorama viewing with intuitive controls for exploring underwater environments.

## Features

- **Interactive 3D Panorama Viewer**: Immersive inverse sphere rendering for 360° underwater panoramas
- **Multiple Scene Support**: Navigate between different panoramic scenes
- **Intuitive Controls**: Drag to look around, scroll to zoom
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **XMP Metadata Parsing**: Extracts panorama metadata from JPEG files
- **Optimized Performance**: Built with React 19.2 and Next.js 16.2
- **Type-Safe**: Written in TypeScript for enhanced code reliability
- **Comprehensive Testing**: Unit and E2E tests with Vitest and Puppeteer

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Cott3r/seasee-r-immersive-rov-mapping.git
cd seasee-r-immersive-rov-mapping
npm install
```

**Requirements:**
- Node.js 22.x or higher
- npm 10.x or higher

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The development server includes:
- Hot Module Replacement (HMR)
- Fast Refresh for instant updates
- TypeScript error reporting

## Build & Production

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.

### Start Production Server

```bash
npm start
```

The production server will start on [http://localhost:3000](http://localhost:3000).

## Testing

The project uses Vitest for both unit and end-to-end testing, with Puppeteer for browser automation.

### Run Unit Tests

```bash
npm run test:unit
```

Runs all unit tests in the `tests/unit/` directory once and exits.

### Run End-to-End Tests

```bash
npm run test:e2e
```

Runs all E2E tests in the `tests/e2e/` directory once and exits.

### Run E2E Tests in CI Mode

```bash
npm run test:e2e:ci
```

Starts the production server, waits for it to be ready, then runs E2E tests.

## Available Scripts

| Script                | Description                                    |
|-----------------------|------------------------------------------------|
| `npm run dev`         | Start development server with hot reload       |
| `npm run build`       | Create optimized production build              |
| `npm start`           | Start production server                        |
| `npm run lint`        | Run ESLint to check code quality               |
| `npm run test:unit`   | Run unit tests once                            |
| `npm run test:e2e`    | Run end-to-end tests once                      |
| `npm run test:e2e:ci` | Run E2E tests in CI mode (with server startup) |


## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this Next.js app is with [Vercel](https://vercel.com):

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository in [Vercel](https://vercel.com/new)
3. Vercel will automatically detect Next.js and configure the build settings
4. Click "Deploy"

Your app will be live with automatic HTTPS, global CDN, and continuous deployment on every push.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repository-url>)

### Manual Deployment

For other platforms:

1. Build the application: `npm run build`
2. The build output will be in `.next/`
3. Set `NODE_ENV=production`
4. Run `npm start` on your server

### Environment Configuration

Ensure your deployment platform has:
- Node.js 22.x or higher
- npm 10.x or higher
- Build command: `npm run build`
- Start command: `npm start`
- Output directory: `.next`

## License

This project is licensed under the GNU General Public License v3.0 – see the [LICENSE](LICENSE) file for details.

## Tech Stack

- **Framework**: [Next.js 16.2](https://nextjs.org/) with React 19.2
- **3D Rendering**: [Three.js 0.183](https://threejs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Testing**: [Vitest 4.1](https://vitest.dev/) + [Puppeteer 24](https://pptr.dev/)

## Acknowledgments

- Developed as part of the Google Summer of Code (GSoC) Master's Thesis project
- Built for underwater exploration and ROV mapping applications

---

**Made with 💙 for underwater exploration and ROV mapping**
