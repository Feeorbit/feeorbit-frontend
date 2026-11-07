import './globals.css';
import { ToastProvider } from '../context/ToastContext';
import { GymProvider } from '../context/GymContext';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import AppShell from '../components/AppShell';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://feeorbit.com'),
  title: {
    default: 'FeeOrbit | All-in-One Gym Operating System & Fee Management ERP',
    template: '%s | FeeOrbit',
  },
  description:
    'FeeOrbit is an enterprise-grade gym management operating system. Automate member billing, QR attendance kiosks, staff payroll, automated WhatsApp fee recovery reminders, and real-time revenue analytics.',
  applicationName: 'FeeOrbit',
  keywords: [
    'gym management software',
    'gym ERP system',
    'fitness studio software',
    'automated fee collection',
    'gym attendance kiosk',
    'WhatsApp gym reminders',
    'gym billing and tax receipts',
    'gym membership CRM',
    'trainer payroll management',
    'gym equipment tracking',
    'FeeOrbit',
  ],
  authors: [{ name: 'FeeOrbit Technologies', url: 'https://feeorbit.com' }],
  creator: 'FeeOrbit Engineering',
  publisher: 'FeeOrbit Technologies Inc.',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FeeOrbit | All-in-One Gym Operating System & Fee Management ERP',
    description:
      'Scale your fitness club operations, automate WhatsApp fee reminders, track member check-ins with kiosk QR codes, and boost revenue with FeeOrbit.',
    url: 'https://feeorbit.com',
    siteName: 'FeeOrbit OS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/feeorbit-logo.svg',
        width: 1200,
        height: 630,
        alt: 'FeeOrbit - Enterprise Gym Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FeeOrbit | Next-Gen Gym Operating System',
    description:
      'Automated fee recovery, biometric attendance, and revenue analytics for modern gym owners.',
    images: ['/feeorbit-logo.svg'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'business',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090c15' },
    { media: '(prefers-color-scheme: light)', color: '#090c15' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  // Schema.org Structured Data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://feeorbit.com/#software',
        name: 'FeeOrbit',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All modern browsers, iOS, Android, Windows, macOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
        description:
          'Enterprise-grade Gym Operating System & Fee Management ERP with automated WhatsApp reminders, biometric QR kiosk, member CRM, and real-time revenue analytics.',
        featureList: [
          'Automated WhatsApp & Email Fee Recovery Reminders',
          'Biometric & QR Code Attendance Kiosk Desk',
          'Multi-Branch Multi-Tenant Gym Management',
          'Member Subscription Plans & Instant Tax Invoices',
          'Staff & Trainer Payroll Ledger',
          'Equipment Health & Preventative Maintenance Log',
          'Real-Time Daily Inflows & P&L Statement',
        ],
      },
      {
        '@type': 'Organization',
        '@id': 'https://feeorbit.com/#organization',
        name: 'FeeOrbit Technologies',
        url: 'https://feeorbit.com',
        logo: 'https://feeorbit.com/feeorbit-logo.svg',
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = localStorage.getItem('feeorbit_theme_preset') || 'midnight';
                  var isLight = ['pearl', 'arctic', 'champagne', 'mint'].indexOf(p) !== -1 || localStorage.getItem('feeorbit_theme_mode') === 'light';
                  var mode = isLight ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', p);
                  document.documentElement.setAttribute('data-theme-mode', mode);
                  var c = localStorage.getItem('feeorbit_theme_color');
                  if (c && (c !== '#6366f1' || p === 'midnight' || p === 'pearl')) {
                    document.documentElement.style.setProperty('--brand-primary', c);
                    document.documentElement.style.setProperty('--brand-primary-glow', c + '55');
                    document.documentElement.style.setProperty('--brand-primary-light', c + '1a');
                  }
                  // Instant session awareness
                  var isLoggedOut = localStorage.getItem('feeorbit_logged_out') === 'true';
                  var token = localStorage.getItem('feeorbit_token') || localStorage.getItem('gympulse_token');
                  var user = localStorage.getItem('feeorbit_user') || localStorage.getItem('gympulse_user');
                  if (!isLoggedOut && (token || user || !localStorage.getItem('feeorbit_logged_out'))) {
                    document.cookie = 'feeorbit_logged_in=true; path=/; max-age=31536000; SameSite=Lax';
                  } else {
                    document.cookie = 'feeorbit_logged_in=; path=/; max-age=0; SameSite=Lax';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <GymProvider>
              <LanguageProvider>
                <AppShell>{children}</AppShell>
              </LanguageProvider>
            </GymProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
