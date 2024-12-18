'use client';

export default function Error() {
  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div>
        <h2 style={{ marginBottom: '10px' }}>Something went wrong!</h2>
        <p>Please try again later.</p>
      </div>
    </div>
  );
} 