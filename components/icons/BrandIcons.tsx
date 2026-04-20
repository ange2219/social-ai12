// Logos officiels des plateformes sociales — SVGs exacts fournis

export function IconFacebook({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="15%" fill="#1877f2"/>
      <path d="M355.6 330l11.4-74h-71v-48c0-20.2 9.9-40 41.7-40H370v-63s-29.3-5-57.3-5c-58.5 0-96.7 35.4-96.7 99.6V256h-65v74h65v182h80V330h59.6z" fill="#fff"/>
    </svg>
  )
}

export function IconInstagram({ size = 20 }: { size?: number }) {
  const id = `ig${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}a`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 23) rotate(-55.3758) scale(25.5196)">
          <stop stopColor="#B13589"/>
          <stop offset="0.793" stopColor="#C62F94"/>
          <stop offset="1" stopColor="#8A3AC8"/>
        </radialGradient>
        <radialGradient id={`${id}b`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11 31) rotate(-65.1363) scale(22.5942)">
          <stop stopColor="#E0E8B7"/>
          <stop offset="0.445" stopColor="#FB8A2E"/>
          <stop offset="0.715" stopColor="#E2425C"/>
          <stop offset="1" stopColor="#E2425C" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${id}c`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0.5 3) rotate(-8.1301) scale(38.8909 8.31836)">
          <stop offset="0.157" stopColor="#406ADC"/>
          <stop offset="0.468" stopColor="#6A45BE"/>
          <stop offset="1" stopColor="#6A45BE" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#${id}a)`}/>
      <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#${id}b)`}/>
      <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#${id}c)`}/>
      <path d="M23 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 15.6C6 12.24 6 10.56 6.654 9.276A6 6 0 0 1 9.276 6.654C10.56 6 12.24 6 15.6 6h.8c3.36 0 5.04 0 6.324.654a6 6 0 0 1 2.622 2.622C26 10.56 26 12.24 26 15.6v.8c0 3.36 0 5.04-.654 6.324a6 6 0 0 1-2.622 2.622C21.44 26 19.76 26 16.4 26h-.8c-3.36 0-5.04 0-6.324-.654a6 6 0 0 1-2.622-2.622C6 21.44 6 19.76 6 16.4v-.8zm9.6-7.6h.8c1.713 0 2.878.002 3.778.075.88.072 1.328.205 1.641.364a4 4 0 0 1 1.748 1.748c.16.313.292.761.364 1.641C23.998 12.723 24 13.888 24 15.6v.8c0 1.713-.002 2.878-.075 3.778-.072.88-.205 1.328-.364 1.641a4 4 0 0 1-1.748 1.748c-.313.16-.761.292-1.641.364C19.277 23.998 18.113 24 16.4 24h-.8c-1.713 0-2.878-.002-3.778-.075-.88-.072-1.328-.205-1.641-.364a4 4 0 0 1-1.748-1.748c-.16-.313-.292-.761-.364-1.641C8.002 19.277 8 18.113 8 16.4v-.8c0-1.713.002-2.878.075-3.778.072-.88.205-1.328.364-1.641a4 4 0 0 1 1.748-1.748c.313-.16.761-.292 1.641-.364C12.723 8.002 13.888 8 15.6 8z" fill="white"/>
    </svg>
  )
}

export function IconTikTok({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#010101"/>
      <path fill="white" d="M17.719,10.725h0c-.109.011-.219.016-.328.017A3.571,3.571,0,0,1,14.4,9.129v5.493a4.061,4.061,0,1,1-4.06-4.06c.085,0,.167.008.251.013v2a2.067,2.067,0,1,0-.251,4.119A2.123,2.123,0,0,0,12.5,14.649l.02-9.331h1.914A3.564,3.564,0,0,0,17.719,8.5Z"/>
    </svg>
  )
}

export function IconTwitterX({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.737-8.848L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white" transform="scale(0.72) translate(4.5, 4)"/>
    </svg>
  )
}

export function IconLinkedIn({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="16" height="16" rx="3" fill="#0A66C2"/>
      <path fill="white" d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727z"/>
    </svg>
  )
}

export function IconYouTube({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -38 256 256" xmlns="http://www.w3.org/2000/svg">
      <path d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.868 0 127.868 0S47.913.164 28.047 5.582a32.18 32.18 0 0 0-22.656 22.656C-.615 63.537-2.947 117.322 5.555 151.21a32.18 32.18 0 0 0 22.656 22.656c19.866 5.418 99.821 5.418 99.821 5.418s79.955 0 99.821-5.418a32.18 32.18 0 0 0 22.656-22.656c6.338-35.348 8.291-89.096-.163-123.135z" fill="#FF0000"/>
      <polygon fill="#FFFFFF" points="102.421 128.06 168.749 89.642 102.421 51.224"/>
    </svg>
  )
}

export function IconPinterest({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#E60023"/>
      <path d="M12 4C7.6 4 4 7.6 4 12c0 3.4 2.1 6.3 5 7.6-.1-.6-.1-1.6.1-2.3l1-4s-.3-.5-.3-1.3c0-1.2.7-2.1 1.6-2.1.8 0 1.1.6 1.1 1.2 0 .8-.5 1.9-.7 2.9-.2.9.4 1.6 1.3 1.6 1.5 0 2.7-1.6 2.7-3.9 0-2-1.5-3.5-3.6-3.5-2.4 0-3.8 1.8-3.8 3.7 0 .7.3 1.5.6 1.9.1.1.1.2 0 .3l-.2 1c0 .1-.1.2-.2.1-1.3-.6-2.1-2.5-2.1-4C7 8.7 9.4 6 13 6c3 0 5 2.1 5 4.8 0 3-1.8 5.3-4.4 5.3-.9 0-1.7-.4-1.9-1l-.5 2c-.2.7-.6 1.5-.9 2 .7.2 1.4.3 2.1.3 4.4 0 8-3.6 8-8s-3.6-8-8-8z" fill="white"/>
    </svg>
  )
}
