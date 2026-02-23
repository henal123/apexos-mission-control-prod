# Mission Control v2.0 - Deployment Guide

## ✅ DEPLOYMENT FIXES APPLIED (2026-02-23)

### Fixes by Code-Architect (CTO Velocity subagent)

1. **Removed Static Export Mode** 
   - Changed `next.config.mjs` from `output: 'export'` to server-side deployment
   - This enables API routes and middleware on Vercel
   - Removed `distDir: 'dist'` and `images: { unoptimized: true }`

2. **Fixed Path Alias Type Exports**
   - Added `export type { Agent, GatewayStatus, SubagentInfo }` to `src/lib/openclaw-client.ts`
   - Resolves TypeScript error: Module declares 'Agent' locally
   - Path aliases (`@/components`, `@/lib`) were already configured correctly in `tsconfig.json`

3. **Updated Vercel Configuration**
   - Changed `vercel.json` to use `"framework": "nextjs"` 
   - Removed `"outputDirectory": "dist"` (not needed for server builds)
   - Builds output to `.next/` directory (Vercel default)

### Build Status
```
✓ Compiled successfully
✓ Generating static pages (13/13)
✓ Finalizing page optimization
✓ API routes configured
✓ Middleware configured
Build: SUCCESS
```

## 🚀 Deploy to Vercel

### Prerequisites
- Vercel account with token
- Environment variables configured

### Deploy Commands

```bash
cd /root/.openclaw/workspace/apexos-mission-control

# Login (if not already logged in)
vercel login

# Deploy to production
vercel --prod

# Or with token (CI/CD)
vercel --token $VERCEL_TOKEN --prod
```

### Environment Variables (Vercel Dashboard)
```
OPENCLAW_GATEWAY_URL=ws://24.83.78.218:18789
OPENCLAW_GATEWAY_TOKEN=37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3
```

## 📁 Configuration Files Updated

| File | Changes |
|------|---------|
| `next.config.mjs` | Removed static export, enabled server mode |
| `vercel.json` | Set framework to nextjs, removed outputDirectory |
| `src/lib/openclaw-client.ts` | Added type exports |

## ✓ Deployment Checklist

- [x] Path aliases configured correctly
- [x] Type exports fixed
- [x] Static export removed
- [x] Build succeeds locally
- [x] API routes work
- [x] Middleware compatible
- [ ] Vercel token configured
- [ ] Production deployment completed
