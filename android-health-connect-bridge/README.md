# AfyaNexus Android Health Connect Bridge

This is a compact Android demo bridge for panel presentations.

It does three things:
- requests Health Connect read permissions
- reads recent training, sleep, heart rate, steps, and nutrition data
- sends a normalized payload to `POST /api/athlete/sources/health-connect/import`

## What you need

- Android Studio
- Android device with Health Connect available
- the AfyaNexus server running and reachable from the phone
- a valid athlete JWT token from AfyaNexus login

## Demo flow

1. Build and install the app.
2. Enter the server URL and athlete JWT token.
3. Tap `Grant Health Connect Permissions`.
4. Tap `Sync Last 7 Days to AfyaNexus`.
5. Open the AfyaNexus athlete dashboard and show the imported source labels.

## Notes

- The app is intentionally small and presentation-focused.
- It aggregates recent records into the current backend import contract.
- If your server is on a laptop during demo, use a LAN IP such as `http://192.168.x.x:5000/api`.
