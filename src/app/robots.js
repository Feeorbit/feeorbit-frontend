export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feeorbit.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/kiosk', '/scan', '/portal', '/events'],
        disallow: ['/api/', '/superadmin/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
