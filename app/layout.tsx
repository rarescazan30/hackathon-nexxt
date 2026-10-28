import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeSync } from '@/components/theme-sync'

export const metadata: Metadata = {
  title: 'zile. — How will you live in retirement?',
  description: 'Round up your card payments, grow your Pillar III pension, and see how you will live in retirement.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

const stripBrowserExtensionAttrsScript = `(function(){try{var bad=function(n){return n==='bis_skin_checked'||n==='bis_register'||n==='bis_id'||n==='bis_size'||n.indexOf('__processed_')===0};var d=Object.getOwnPropertyDescriptor(Element.prototype,'attributes');if(d&&d.get){Object.defineProperty(Element.prototype,'attributes',{configurable:true,enumerable:true,get:function(){var a=d.get.call(this);if(a){for(var i=a.length-1;i>=0;i--){var n=a[i]&&a[i].name;if(n&&bad(n))this.removeAttribute(n)}}return a}})}var cleanAll=function(){var all=document.querySelectorAll('[bis_skin_checked],[bis_register],[bis_id],[bis_size]');for(var i=0;i<all.length;i++){var el=all[i];el.removeAttribute('bis_skin_checked');el.removeAttribute('bis_register');el.removeAttribute('bis_id');el.removeAttribute('bis_size')}};cleanAll();var mo=new MutationObserver(cleanAll);mo.observe(document.documentElement,{attributes:true,childList:true,subtree:true})}catch(e){}})();`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: stripBrowserExtensionAttrsScript }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
