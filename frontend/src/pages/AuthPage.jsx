import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'

export default function AuthPage() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'

  return (
    <AuthForm key={location.pathname} isSignup={isSignup} />
  )
}

function AuthForm({ isSignup }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [emailValue, setEmailValue] = useState(() =>
    typeof location.state?.email === 'string' ? location.state.email : ''
  )
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim()
    const password = formData.get('password')?.toString()
    const confirmPassword = formData.get('confirmPassword')?.toString()
    const name = formData.get('name')?.toString().trim()

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (isSignup && !name) {
      setError('Please enter your full name.')
      return
    }

    if (isSignup && !/^[A-Za-z][A-Za-z .'’-]*$/.test(name)) {
      setError('Name can only contain letters and spaces.')
      return
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setDuplicateEmail(false)
    setLoading(true)

    try {
      const result = await apiFetch(`/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      if (isSignup) {
        navigate('/login', { replace: true })
        return
      }

      localStorage.setItem('tripguard-auth-token', result.token)
      localStorage.setItem('tripguard-authenticated', 'true')
      localStorage.setItem('tripguard-user', JSON.stringify(result.user))
      navigate('/dashboard')
    } catch (requestError) {
      setDuplicateEmail(isSignup && requestError.status === 409)
      setError(
        requestError instanceof TypeError
          ? 'Backend is unavailable. Start the API with npm run dev in backend.'
          : requestError.message || 'Unable to complete the request.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--bg-1)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            TripGuard AI
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            {isSignup
              ? 'Save your trips and start planning smarter.'
              : 'Sign in to open your personalized trip planner.'}
          </p>
        </div>

        <form className="grid gap-4" autoComplete="off" onSubmit={handleSubmit}>
          {isSignup ? (
            <label className="grid gap-1 text-sm text-[color:var(--text-soft)]">
              Full name
              <input
                name="name"
                type="text"
                autoComplete="name"
                pattern="[A-Za-z][A-Za-z .'’\-]*"
                title="Name can only contain letters and spaces."
                value={nameValue}
                onChange={(event) => setNameValue(event.target.value.replace(/[^A-Za-z .'’-]/g, ''))}
                required
                className="rounded-xl bg-[color:var(--glass)] px-3 py-3 outline-none ring-1 ring-[color:var(--glass-border)] focus:ring-orange-300"
              />
            </label>
          ) : null}

          <label className="grid gap-1 text-sm text-[color:var(--text-soft)]">
            Email
            <input
              name="email"
              type="email"
                autoComplete="off"
                value={emailValue}
                onChange={(event) => setEmailValue(event.target.value)}
              required
              className="rounded-xl bg-[color:var(--glass)] px-3 py-3 outline-none ring-1 ring-[color:var(--glass-border)] focus:ring-orange-300"
            />
          </label>

          <label className="grid gap-1 text-sm text-[color:var(--text-soft)]">
            Password
            <input
              name="password"
              type="password"
                autoComplete="new-password"
                value={passwordValue}
                onChange={(event) => setPasswordValue(event.target.value)}
              minLength={6}
              required
              className="rounded-xl bg-[color:var(--glass)] px-3 py-3 outline-none ring-1 ring-[color:var(--glass-border)] focus:ring-orange-300"
            />
          </label>

          {isSignup ? (
            <label className="grid gap-1 text-sm text-[color:var(--text-soft)]">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="off"
                value={confirmPasswordValue}
                onChange={(event) => setConfirmPasswordValue(event.target.value)}
                minLength={6}
                required
                className="rounded-xl bg-[color:var(--glass)] px-3 py-3 outline-none ring-1 ring-[color:var(--glass-border)] focus:ring-orange-300"
              />
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}{' '}
              {duplicateEmail ? (
                <Link
                  to="/login"
                  state={{ email: emailValue }}
                  className="font-semibold text-orange-300 hover:underline"
                >
                  Sign in instead
                </Link>
              ) : null}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 px-6 py-3 font-semibold text-white shadow-md transition hover:brightness-110"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in and start planning'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--text-muted)]">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            to={isSignup ? '/login' : '/signup'}
            className="font-semibold text-orange-300 hover:underline"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </section>
    </main>
  )
}