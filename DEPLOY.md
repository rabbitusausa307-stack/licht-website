# LICHT Website Deployment

## Current Hosting

- Production domain: `licht-juku.com`
- Netlify site: `cheery-narwhal-3bcc66.netlify.app`
- Site type: single static HTML file
- Entry file: `index.html`

## Repository Structure

```txt
index.html
netlify.toml
DEPLOY.md
```

All images are embedded in `index.html` as base64 data URLs. Do not add an image asset folder unless the site is intentionally changed away from the single-file structure.

## Netlify Settings

Use these settings in Netlify:

```txt
Build command:
Publish directory: .
```

The build command should be empty because this site has no build step.

## Custom Domain

In Netlify:

1. Open Site configuration.
2. Go to Domain management.
3. Add `licht-juku.com` as the primary domain.
4. Add `www.licht-juku.com` as a domain alias if needed.
5. Enable HTTPS after DNS propagation completes.

## DNS

If using Netlify DNS, set the domain's nameservers to the values Netlify shows.

If using an external DNS provider, follow Netlify's domain management screen for the current recommended records. Typically:

```txt
Type   Name   Value
ALIAS  @      cheery-narwhal-3bcc66.netlify.app
CNAME  www    cheery-narwhal-3bcc66.netlify.app
```

Some DNS providers do not support `ALIAS` or `ANAME` at the root. In that case, use the exact `A` record values shown by Netlify for the apex domain.

## Blog Updates

Add articles in `index.html` near the bottom:

```js
var ARTICLES = [
  {
    id: 1,
    tag: "勉強法",
    title: "記事タイトル",
    date: "2026-06-25",
    body: `
      <p>記事本文</p>
    `
  }
];
```
