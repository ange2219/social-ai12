export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: '3rem' }}>📡</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pas de connexion</h1>
      <p style={{ color: '#888', margin: 0, maxWidth: 320 }}>
        Vérifiez votre connexion internet et réessayez.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '0.5rem',
          padding: '0.6rem 1.4rem',
          background: '#3B7BF6',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Réessayer
      </button>
    </div>
  )
}
