# SEO Troubleshooting Guide

## Common Problems & Solutions

---

## 1. Meta Tags Not Updating on Page Navigation

### Symptoms
- Changing pages but page title doesn't update
- Meta description stays the same
- Open Graph tags don't change

### Diagnosis

**Step 1**: Check if Helmet is updating
```bash
# Open browser DevTools → Console
# Type: document.title
# Should show the current page title
```

**Step 2**: Inspect `<head>` in DevTools
- Open DevTools → Elements
- Look for `<meta name="description">`
- Check if it matches expected content

### Solutions

**Solution 1**: Hard Refresh Browser
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
Or: Clear cache in DevTools → Network → Disable cache
```

**Solution 2**: Verify HelmetProvider Setup
Check `src/main.jsx`:
```jsx
✅ CORRECT:
import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
)

❌ WRONG:
// Missing HelmetProvider wrapper
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
```

**Solution 3**: Verify PageHead Import
Check page component:
```jsx
✅ CORRECT:
import { PageHead } from '../components/PageHead'

export default function MyPage() {
  return (
    <>
      <PageHead title="..." description="..." />
      {/* content */}
    </>
  )
}

❌ WRONG:
// Missing PageHead component
export default function MyPage() {
  return (
    <div>
      {/* content - no meta tags */}
    </div>
  )
}
```

---

## 2. robots.txt Not Found (404)

### Symptoms
```
GET /robots.txt 404 Not Found
```

### Diagnosis

**Step 1**: Check file exists
```bash
ls -la client/public/robots.txt
```

**Step 2**: Check in production build
```bash
ls -la client/dist/robots.txt
```

### Solutions

**Solution 1**: Recreate robots.txt
```bash
cat > client/public/robots.txt << 'EOF'
User-agent: *
Allow: /
Disallow: /dashboard

Sitemap: https://woofmeetup.com/sitemap.xml
EOF
```

**Solution 2**: Configure Vite to copy file
Check `client/vite.config.js`:
```js
import { defineConfig } from 'vite'

export default defineConfig({
  // Vite automatically copies public/ to dist/
  // No additional configuration needed
})
```

**Solution 3**: Manual copy in production
```bash
# After building
cp client/public/robots.txt client/dist/robots.txt
```

---

## 3. Sitemap XML Not Loading / Invalid XML

### Symptoms
```
XML Parsing Error: not well-formed
```

### Diagnosis

**Step 1**: Validate XML
```bash
# Check syntax
curl https://woofmeetup.com/sitemap.xml | xmllint -

# Or use online tool:
https://www.xml-sitemaps.com/validate-xml-sitemap.html
```

**Step 2**: Check file exists
```bash
ls -la client/public/sitemap.xml
```

### Solutions

**Solution 1**: Fix XML Syntax
Common errors:
```xml
❌ Wrong: Unclosed tags
<url>
  <loc>https://woofmeetup.com</loc>

✅ Correct: Closed tags
<url>
  <loc>https://woofmeetup.com</loc>
</url>
```

**Solution 2**: Validate URLs
All URLs must use HTTPS:
```xml
✅ https://woofmeetup.com/
❌ http://woofmeetup.com/  (HTTP not allowed)
```

**Solution 3**: Check Date Format
Dates must be YYYY-MM-DD:
```xml
✅ <lastmod>2025-11-19</lastmod>
❌ <lastmod>11/19/2025</lastmod>
❌ <lastmod>2025-11-19 09:18:32</lastmod>
```

**Solution 4**: Recreate Sitemap
```bash
cat > client/public/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://woofmeetup.com/</loc>
    <lastmod>2025-11-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOF
```

---

## 4. Open Graph Tags Not Working on Social Media

### Symptoms
- Facebook shows generic preview
- Twitter shows no image
- LinkedIn shows no description

### Diagnosis

**Step 1**: Test with Debuggers
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

**Step 2**: Check meta tags
```bash
curl https://woofmeetup.com | grep "og:"
# Should see meta tags for og:title, og:image, etc.
```

### Solutions

**Solution 1**: Update PageHead Component
Ensure PageHead is setting OG tags:
```jsx
<PageHead
  title="Page Title"
  ogTitle="Better OG Title"
  ogDescription="Custom OG description"
  ogImage="https://woofmeetup.com/image.png"
/>
```

**Solution 2**: Check Image URL
Image must be:
- Publicly accessible
- HTTPS URL only
- Minimum 200x200px
- Maximum 5MB
- PNG, JPG, or GIF

```jsx
✅ CORRECT:
ogImage="https://woofmeetup.com/web-app-manifest-512x512.png"

❌ WRONG:
ogImage="./image.png"  // Relative URL
ogImage="http://..."   // HTTP not HTTPS
```

**Solution 3**: Clear Social Media Cache
**Facebook**:
1. Go to https://developers.facebook.com/tools/debug/
2. Paste your URL
3. Click "Scrape Again"

**Twitter**:
1. Go to https://cards-dev.twitter.com/validator
2. Enter URL and validate

---

## 5. Page Title Not Appearing in Search Results

### Symptoms
- Google shows generic title
- Old title shows in search results
- Title tag seems ignored

### Diagnosis

**Step 1**: Check title tag in HTML
```bash
curl https://woofmeetup.com | grep "<title>"
```

**Step 2**: Check Search Console
1. Go to Google Search Console
2. Search for your URL
3. Check what title Google sees

### Solutions

**Solution 1**: Verify PageHead Title
```jsx
<PageHead
  title="Specific Page Title"  // This is required
  description="..."
/>
```

**Solution 2**: Follow Title Guidelines
- **Length**: 30-60 characters
- **Keyword**: Include primary keyword
- **Brand**: Include "Woof Meetup"
- **Format**: "Keyword | Woof Meetup"

```jsx
✅ CORRECT:
title="Dog Dating App for Matchmaking | Woof Meetup"

❌ WRONG:
title="Home"  // Too generic
title="Welcome to the Most Amazing Dog Dating Platform in the History of the Internet | Woof Meetup"  // Too long
```

**Solution 3**: Request Reindex
1. Go to Google Search Console
2. Click "Request Indexing"
3. Google will recrawl your page

---

## 6. Keywords Not Ranking

### Symptoms
- URLs not appearing for target keywords
- Low impressions in Search Console
- Competitors ranking for same keywords

### Diagnosis

**Step 1**: Check Search Console
1. Go to Google Search Console
2. Go to "Performance"
3. Filter by page URL
4. Check impressions and rankings

**Step 2**: Verify Keywords in Content
- Keywords should appear 1-3 times naturally
- Avoid keyword stuffing
- Use variations (synonyms)

### Solutions

**Solution 1**: Improve Meta Description
Make it compelling:
```
✅ GOOD: "Connect with dog owners and arrange meetups for your furry friends. Join Woof Meetup today!"

❌ BAD: "Dog dating app where dogs meet"
```

**Solution 2**: Add Content
For search result visibility, page should have:
- Unique, valuable content
- 300+ words for indexable content
- Images with alt text
- Clear information hierarchy

**Solution 3**: Get Backlinks
- Submit to directories
- Social media promotion
- Press releases
- Guest posts

**Solution 4**: Check for Indexing Issues
```bash
# Search in Google
site:woofmeetup.com
# Should show indexed pages

# Check for 404s
site:woofmeetup.com/missing-page
# Should return 0 results
```

---

## 7. robots.txt Blocking Crawling

### Symptoms
- Google Search Console shows "Blocked by robots.txt"
- Pages not indexed
- Crawl rate very low

### Diagnosis

**Step 1**: Check robots.txt content
```bash
curl https://woofmeetup.com/robots.txt
```

**Step 2**: Test with Google
1. Go to Google Search Console
2. Tools → Robots.txt Tester
3. Test specific URL paths

### Solutions

**Solution 1**: Allow Public Pages
```txt
User-agent: *
Allow: /
Allow: /pricing
Allow: /forgot-password

Disallow: /dashboard  # Only disallow protected
Disallow: /api/*      # Disallow APIs
```

**Solution 2**: Check Disallow Syntax
```
✅ CORRECT:
Disallow: /dashboard
Disallow: /admin

❌ WRONG:
Disallow: dashboard  # Missing leading /
Disallow: /dashboard/  # Trailing slash matters
```

**Solution 3**: Test in Search Console
1. Go to Google Search Console
2. Tools → Robots.txt Tester
3. Enter URL path (e.g., `/`)
4. Should show: "This page is allowed"

---

## 8. Structured Data Not Validating

### Symptoms
- Rich results not showing
- Schema.org validator shows errors
- Google Rich Results Test shows warnings

### Diagnosis

**Step 1**: Test with Google
https://search.google.com/test/rich-results

**Step 2**: Validate with Schema.org
https://validator.schema.org/

### Solutions

**Solution 1**: Fix JSON-LD Syntax
```json
✅ CORRECT:
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Woof Meetup"
}

❌ WRONG:
{
  "@context": "https://schema.org",
  "@type": "WebApplication"
  "name": "Woof Meetup"  // Missing comma
}
```

**Solution 2**: Use Valid Schema Types
Valid for social app:
- WebApplication
- Organization
- LocalBusiness

**Solution 3**: Add Required Properties
WebApplication schema requires:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Woof Meetup",
  "url": "https://woofmeetup.com",
  "applicationCategory": "SocialNetworking"
}
```

---

## 9. Performance Issues / Slow Page Load

### Symptoms
- Google Search Console shows Core Web Vitals warnings
- PageSpeed Insights score < 50
- Lighthouse performance score < 50

### Diagnosis

**Step 1**: Run PageSpeed Insights
https://pagespeed.web.dev/

**Step 2**: Run Lighthouse
Chrome DevTools → Lighthouse → Performance

### Solutions

**Solution 1**: Optimize Images
```jsx
✅ CORRECT:
<img 
  src="/image.webp"
  loading="lazy"
  width="400"
  height="300"
  alt="Description"
/>

❌ WRONG:
<img src="/image-high-res.jpg" />  // No optimization
```

**Solution 2**: Lazy Load Non-Critical Resources
```jsx
import { lazy } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))
```

**Solution 3**: Remove Unused CSS
- Check for unused CSS in DevTools Coverage
- Remove unused Tailwind utilities
- Minimize CSS file size

**Solution 4**: Reduce Bundle Size
```bash
# Analyze bundle
npm run build:analyze --prefix client

# Check for large dependencies
npm list --depth=0 --prefix client
```

---

## 10. Mobile SEO Issues

### Symptoms
- Mobile-Friendly Test shows errors
- Layout shifts on mobile
- Text too small to read

### Diagnosis

**Step 1**: Mobile-Friendly Test
https://search.google.com/test/mobile-friendly

**Step 2**: Test on real mobile device
- iPhone or Android phone
- Test all pages
- Check readability

### Solutions

**Solution 1**: Fix Viewport Meta Tag
Already configured in `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Solution 2**: Fix Font Size
```css
✅ CORRECT:
body {
  font-size: clamp(14px, 2vw, 16px);
}

❌ WRONG:
body {
  font-size: 12px;  // Too small on mobile
}
```

**Solution 3**: Fix Touch Targets
All buttons should be minimum 48x48px:
```css
✅ CORRECT:
button {
  padding: 12px 16px;  /* Minimum 48px height */
  min-height: 48px;
}

❌ WRONG:
button {
  padding: 4px 8px;  /* Too small for touch */
}
```

---

## 11. Content Duplication Issues

### Symptoms
- Google Search Console shows duplicate content warnings
- Same content on multiple URLs
- Lower ranking than expected

### Diagnosis

**Step 1**: Check for duplicate URLs
```bash
# Search for duplicates
site:woofmeetup.com "page title"
# Should return only 1 result
```

**Step 2**: Check trailing slashes
```
https://woofmeetup.com/page
https://woofmeetup.com/page/
# Google treats these as different URLs!
```

### Solutions

**Solution 1**: Set Canonical URL
Already handled in PageHead:
```jsx
<PageHead
  title="..."
  canonical="https://woofmeetup.com/page"
/>
```

**Solution 2**: Remove Trailing Slashes Consistently
Configure server to redirect:
```bash
# Redirect to non-trailing slash
https://woofmeetup.com/page/ → https://woofmeetup.com/page
```

**Solution 3**: Add to Search Console
1. Go to Google Search Console
2. Settings → Preferred Domain
3. Choose www or non-www version

---

## Getting Help

### Debug Process

1. **Identify the Problem**
   - Search this document for matching symptoms
   - Check relevant tool (Search Console, Lighthouse, etc.)

2. **Follow Diagnosis Steps**
   - Run suggested commands
   - Review output carefully

3. **Implement Solution**
   - Try solutions in order
   - Hard refresh browser after changes
   - Wait 24-48 hours for Search Console updates

4. **Verify Fix**
   - Re-run diagnostic tool
   - Monitor Search Console
   - Check rankings in Google

### Escalation

If issue persists:
1. Check `docs/SEO/README.md` for detailed info
2. Review implementation in `docs/SEO/IMPLEMENTATION.md`
3. Run full SEO audit with Lighthouse
4. Submit to Google Search Console for manual review

### Useful Commands

```bash
# Check meta tags
curl https://woofmeetup.com | grep -E "<meta|<title"

# Test robots.txt
curl https://woofmeetup.com/robots.txt

# Validate XML
xmllint client/public/sitemap.xml

# Check for errors
npm run lint --prefix client

# Run production build
npm run build --prefix client
```

---

## Prevention Checklist

- [ ] Always use PageHead for new pages
- [ ] Keep meta descriptions 155-160 chars
- [ ] Use descriptive page titles
- [ ] Test all meta tags before deployment
- [ ] Update robots.txt when adding protected routes
- [ ] Update sitemap.xml for new public pages
- [ ] Hard refresh browser before testing
- [ ] Use Google Search Console regularly
- [ ] Monitor performance in PageSpeed Insights
- [ ] Run Lighthouse quarterly
