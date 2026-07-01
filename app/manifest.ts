import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sakura English Journey',
    short_name: 'Sakura English',
    description: 'Master English in a 90-day interactive path.',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF6F1',
    theme_color: '#E8A6B8',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
