import { Helmet } from 'react-helmet-async'

export const PageHead = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  canonical,
  robots,
  children,
}) => {
  const siteTitle = 'Woof Meetup'
  const siteUrl = import.meta.env.VITE_API_URL || 'https://www.woofmeetup.com'
  const defaultImage =
    `${siteUrl}/web-app-manifest-192x192.png` ||
    'https://www.woofmeetup.com/og-image.png'

  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const fullOgTitle = ogTitle || title || siteTitle
  const fullOgDescription =
    ogDescription ||
    description ||
    'Connect with dog owners and arrange meetups for your furry friends. Create free account, wag right to find a match! Start chatting with 10 free credits.  Make new friends for you and your dog today!'
  const fullOgImage = ogImage || defaultImage
  const fullOgUrl = ogUrl || siteUrl
  const canonicalUrl = canonical || fullOgUrl

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullOgDescription} />

      {robots && <meta name="robots" content={robots} />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullOgTitle} />
      <meta property="og:description" content={fullOgDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:site_name" content={siteTitle} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullOgTitle} />
      <meta name="twitter:description" content={fullOgDescription} />
      <meta name="twitter:image" content={fullOgImage} />

      <link rel="canonical" href={canonicalUrl} />

      {children}
    </Helmet>
  )
}
