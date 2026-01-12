### Universal links

For a better user experience, you can use **Universal Links** instead of custom URL schemes. Universal Links allow your app to open directly from web links without showing a browser redirect prompt.

To enable Universal Links, you need to:

1. **Configure Associated Domains** in your Xcode project:

   - Add your domain to the Associated Domains capability
   - Format: `applinks:yourdomain.com`

2. **Host the Apple App Site Association (AASA) file** on your own infrastructure:
   - The file must be accessible at `https://yourdomain.com/.well-known/apple-app-site-association` or `https://yourdomain.com/apple-app-site-association`
   - The file must be served with `Content-Type: application/json` (or `text/json`)
   - The file must be accessible over HTTPS without redirects
   - The file should not have a file extension

<Admonition type="caution">

Supabase does not currently support hosting the AASA file. You must host this file on your own
infrastructure following [Apple's best
practices](https://developer.apple.com/documentation/xcode/supporting-associated-domains).

</Admonition>

The AASA file format should look like this:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.BUNDLE_ID",
        "paths": ["*"]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID and `BUNDLE_ID` with your app's bundle identifier.

For detailed setup instructions, see [Apple's documentation on supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains).
