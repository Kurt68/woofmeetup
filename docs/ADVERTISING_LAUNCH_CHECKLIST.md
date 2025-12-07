# Woof Meetup - Ad Campaign Launch Checklist

**Use this checklist immediately before launching your Google Ads campaign.**

---

## 🟢 PRE-LAUNCH (Do This Before Spending Money)

### Tracking Verification (20 mins)

- [ ] **GA4 Setup Check**
  - Verify ID: `G-M5CT4ZDBRR`
  - Open browser DevTools → Network tab
  - Refresh any page on woof-meetup
  - Search for "GA4" or "g-m5ct4" request (should see POST to google)
  - If not found: Pixel not firing - **STOP**, check `.env.production`

- [ ] **Facebook Pixel Check**
  - Pixel ID: `1848106269430105`
  - Install browser extension: "Facebook Pixel Helper"
  - Refresh website home page
  - Should see notification showing Pixel firing
  - If not: **STOP**, check `.env.production`

- [ ] **Google Ads Conversion ID Check**
  - ID: `AW-17768115674/g6B-CKDL3MwbENrbv5hC`
  - Open Google Tag Manager or GA4 DebugView
  - Look for `conversion` event with `send_to: AW-17768115674/...`
  - If missing: **STOP**, check implementation

- [ ] **Test Signup Flow (Use Test Email)**
  - Create test account: testuser+[date]@gmail.com
  - Complete signup process
  - Create dog profile
  - Verify in GA4 Admin → Conversion events:
    - ✅ `user_signup` recorded
    - ✅ `dog_profile_created` recorded
  - Verify in Facebook Pixel Helper:
    - ✅ `CompleteRegistration` event appears
  - If anything missing: Debug before spending

- [ ] **Test Payment Flow (If Applicable)**
  - Initiate credit purchase with Stripe test card: `4242 4242 4242 4242`
  - Complete payment
  - Verify in GA4:
    - ✅ `purchase` event recorded with value
  - Verify in Facebook Pixel:
    - ✅ `Purchase` event appears
  - **Note:** Don't worry if Stripe charges fail in test mode; tracking still fires

- [ ] **UTM Parameter Test**
  - Create test URL with parameters:
    ```
    https://woofmeetup.com?utm_source=google&utm_campaign=test_launch&utm_medium=cpc
    ```
  - Visit URL, refresh page
  - Open GA4 → Acquisition → Source/Medium
  - Should see `google / cpc` traffic within minutes
  - If not found: Wait 24 hours (GA4 has delay), or check Events in real-time debugger

### Website & Copy (15 mins)

- [ ] **Mobile Responsiveness**
  - Test signup on iPhone/Android (DevTools device emulation OK)
  - Form inputs should be clearly visible
  - Buttons should be tappable (min 44x44px)
  - No horizontal scrolling

- [ ] **Form Validation**
  - Try submitting empty signup form
  - Should show validation error (required fields highlighted)
  - Try submitting invalid email
  - Should show "enter valid email" error

- [ ] **Page Load Speed**
  - Check homepage load time (Lighthouse)
  - Target: <3 seconds on 4G
  - If slow: Optimize images, defer non-critical JS
  - Use: Chrome DevTools → Lighthouse

- [ ] **Privacy & Compliance**
  - Check Privacy Policy mentions:
    - ✅ "We use Google Analytics to track user behavior"
    - ✅ "We use Facebook Pixel for advertising"
    - ✅ "Pixel collects data to improve ads"
  - Check Terms of Service
  - If missing: Add disclosure before launching

### Google Ads Setup (15 mins)

- [ ] **Account & Billing**
  - [ ] Google Ads account created
  - [ ] Payment method added and verified
  - [ ] Spend limit set to $20/day maximum (safety)
  - [ ] Billing alerts configured (email if spend exceeds budget)

- [ ] **Conversion Setup**
  - [ ] Go to: Tools & Settings → Conversions → Conversion Actions
  - [ ] Verify conversion exists: "sign_up"
  - [ ] Conversion settings:
    - [ ] Category: Signup
    - [ ] Value: 1 (or leave blank for non-monetary)
    - [ ] Conversion window: 30 days
    - [ ] Count: Every conversion (not unique)
  - [ ] Conversion action enabled/active

- [ ] **Campaign Configuration**
  - [ ] Campaign name: Clear, descriptive (e.g., "Dog Dating - High Intent Search")
  - [ ] Campaign type: Search
  - [ ] Networks: Google Search + Search Partners (consider turning off Partners initially)
  - [ ] Bidding: Conversion-based (Target CPA or Maximize Conversions)
  - [ ] Daily budget: $15 (conservative for testing)
  - [ ] Start date: Tomorrow (allows final checks)

- [ ] **Keywords & Ad Groups**
  - [ ] Keywords added:
    ```
    Broad: dog dating app
    Phrase: "meet dog owners"
    Exact: [dog social network]
    ```
  - [ ] Negative keywords added (to avoid wasting budget):
    ```
    -free, -game, -dating (to filter non-app searches)
    ```
  - [ ] Max CPC bids set (e.g., $2-3 per click for testing)
  - [ ] Keywords have quality score ≥ 6/10 (green or blue indicator)

- [ ] **Ad Copy & Landing Page**
  - [ ] Ad text proofread (no typos)
  - [ ] All 3 headlines filled + 2 descriptions
  - [ ] Landing page URL matches ad promise (e.g., if ad mentions dog profile, LP shows it)
  - [ ] Landing page URL is HTTPS (not HTTP)
  - [ ] Ad status: Approved (not Under Review or Disapproved)

- [ ] **Audience & Targeting**
  - [ ] Geographic targeting: Set to relevant areas (e.g., US if nationwide app)
  - [ ] Language: English
  - [ ] Device targeting: All devices (mobile should work well)
  - [ ] Age targeting: Optional (if 18+ required, set minimum age)

### Final Verification (10 mins)

- [ ] **Check Campaign Summary**
  - Campaign name ✅
  - Daily budget ✅
  - Target CPA (if using) ✅
  - Conversion tracking ✅
  - Keywords count: 3-10 for first test ✅
  - Expected daily impressions: 20-50 ✅
  - All ads approved ✅

- [ ] **Review Budget Math**
  - Daily budget: $15
  - Weekly: $105
  - Monthly (4 weeks): $420
  - Acceptable for your testing budget? ✅

- [ ] **Enable Campaign**
  - Campaign status: ENABLED (not paused)
  - All systems go? ✅

---

## 🚀 LAUNCH (After Checklist Complete)

**Start campaign by:** [DATE/TIME]

**First 24 hours expectations:**
- Budget: ~$15 spent
- Impressions: 100-500 (depends on keyword competition)
- Clicks: 2-10 (depends on CTR and bid)
- Conversions: 0-1 possible (small sample size)
- **Don't panic if no conversions first day—data accumulates**

**After 3-5 days:**
- Expected data: 5-15 clicks, 1-3 conversions
- Evaluate: Cost per conversion (divide spend by conversions)
- If CPA < $30: Increase daily budget to $20-25 and add keywords
- If CPA > $50: Pause and review keywords, bid strategy, or landing page

---

## 📊 MONITORING (First Week)

### Daily Check (5 mins)
- [ ] Campaign running (status: Enabled)
- [ ] No errors or warnings (red/orange indicators)
- [ ] Spend tracking: Is it around $15/day?

### Every 3 Days
- [ ] Pull Google Ads dashboard screenshot
- [ ] Note: Clicks, Conversions, Spend
- [ ] Calculate: Cost Per Conversion (CPC)
- [ ] Compare vs. target ($15-25)

### After 5-7 Days
- [ ] Export full campaign report (CSV)
- [ ] Analyze:
  - Which keywords got clicks?
  - Which ads got impressions?
  - What's the conversion rate?
- [ ] **Decision:**
  - Good performance? → Keep running, increase budget
  - Okay performance? → Optimize keywords/bids, continue
  - Poor performance? → Pause, review setup, try new keywords

---

## 🔧 Quick Troubleshooting

### No Conversions After $50 Spent

1. **Check tracking:**
   - Open GA4 → Real-time
   - Click your ad URL with utm_source=google
   - Do you see a new user appear in real-time? If no → tracking broken
   - Fix: Check `.env.production` GA4 ID

2. **Check landing page:**
   - Is signup form visible on mobile?
   - Does form submit without errors?
   - Test complete signup flow manually
   - If broken → Fix before continuing

3. **Check bid strategy:**
   - Are you getting impressions? (if yes, keywords are good)
   - Are clicks low? (increase max CPC)
   - Are clicks high but no conversions? (landing page issue)

4. **Check conversion action:**
   - Google Ads → Conversions → Check "sign_up" is enabled
   - Check conversion value is correct (should be 1 or blank for non-monetary)

### High Spend, Low Clicks

- Max CPC too low → Increase to $2-3
- Keywords too specific → Add broader match types
- Ad rank low → Increase bid or improve quality score

### Tracked Conversions in GA4 but Not in Google Ads

- Setup delay: Wait 24 hours
- Check: Conversion action "sign_up" is properly linked to campaign
- Verify: GA4 property ID matches Google Ads linked property

---

## 📞 When to Pause Campaign

**Pause immediately if:**
- Spending >$30/day without any conversions (likely setup issue)
- Landing page showing 500 errors
- Conversion tracking completely broken (0 events in 100 clicks)
- Unexpected charges appearing

---

## ✅ Success Criteria

**Campaign is working if (after 7 days):**
- ✅ Spent ~$100
- ✅ Got 30-50 clicks
- ✅ At least 1-2 conversions
- ✅ CPA between $15-40
- ✅ Can see same traffic in GA4 (utm_source=google)

**Next step:** Scale budget to $25/day, add more keywords, run for 2 weeks

---

**Version:** 1.0  
**Last Updated:** December 2024
