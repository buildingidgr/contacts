export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Contacts API Service</h1>
      <div className="space-y-2">
        <p>Available endpoints:</p>
        <ul className="list-disc pl-5">
          <li>/api/contacts/[id]</li>
          <li>/api/health</li>
        </ul>
      </div>
    </main>
  );
}
