import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '38px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 80,
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
