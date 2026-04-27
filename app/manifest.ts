import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brain2',
    short_name: 'Brain2',
    description: 'Turn messy work inputs into durable, structured knowledge',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f3f0',
    theme_color: '#b83505',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    share_target: {
      action: '/capture/share',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  };
}
