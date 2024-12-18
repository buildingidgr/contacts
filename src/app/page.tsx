import type { NextPage } from 'next'

const Page: NextPage = () => {
  return (
    <div>
      <h1>API Documentation</h1>
      <p>Available endpoints:</p>
      <ul>
        <li>/api/contacts/[id] - Get contact by ID</li>
        <li>/api/health - Health check endpoint</li>
      </ul>
    </div>
  )
}

export default Page
