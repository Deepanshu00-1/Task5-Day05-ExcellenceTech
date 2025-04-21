import { useState } from 'react'
import { signIn } from '../services/auth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    else alert('Logged in!')
  }

  return (
    <div className="flex flex-col gap-4 w-72 mx-auto mt-20">
      <input
        className="border p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white rounded p-2">
        Login
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}

export default Login


// # Run unit tests in watch mode
// npm test

// # Run unit tests with UI
// npm run test:ui

// # Run tests with coverage report
// npm run test:coverage

// # Run end-to-end tests (if you implemented them)
// npm run test:e2e