export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        width: '28px', height: '28px',
        border: '2.5px solid rgba(255,255,255,.08)',
        borderTopColor: '#3B7BF6',
        borderRadius: '50%',
        animation: 'rot .7s linear infinite',
      }} />
    </div>
  )
}
