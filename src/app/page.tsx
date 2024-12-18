function Home() {
  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Contacts API Service</h1>
      <div>
        <p>Available endpoints:</p>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>/api/contacts/[id] - Get contact by ID</li>
          <li>/api/health - Health check endpoint</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
