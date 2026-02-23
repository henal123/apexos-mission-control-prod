# OpenClaw Gateway Connection Guide

## Issue: Gateway Unreachable from HTTPS

When Mission Control is deployed on HTTPS (Vercel), it **cannot** connect to `ws://` (unencrypted) gateway due to browser security policies.

## Solutions:

### Option 1: Use SSH Tunnel (Recommended)
```bash
# From your local machine, create tunnel:
ssh -L 18789:localhost:18789 root@72.61.232.87

# Then in Mission Control, set gateway to:
ws://localhost:18789
```

### Option 2: Access via HTTP (Not HTTPS)
Deploy Mission Control to HTTP-only domain, then ws:// works.

### Option 3: Use OpenClaw CLI Locally
Instead of browser dashboard, use CLI commands:
```bash
openclaw sessions_list
openclaw cron list
```

### Option 4: Server-Side Proxy (Advanced)
Create API route that proxies WebSocket through server.

## Current Gateway Status:
- URL: ws://72.61.232.87:18789 (unencrypted)
- Token: 37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3
- Status: ✅ Running and reachable from VPS
- Browser Access: ❌ Blocked from HTTPS pages

## Recommendation:
For production dashboard, either:
1. Run dashboard locally with SSH tunnel
2. Or access gateway directly via CLI
3. Or set up SSL for gateway (wss://) - requires certificates
