import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#b83505',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '36px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: '-3px',
            fontFamily: 'serif',
          }}
        >
          B2
        </span>
      </div>
    ),
    { ...size },
  );
}
