import { useState } from 'react'
import './AuthScreen.css'

/* ============================================================
   AuthScreen
   Renders either the login or signup form depending on `mode`.
   All auth logic is simulated — credentials are never sent anywhere.
   ============================================================ */
export default function AuthScreen({ mode, brand, onToggle, onSubmit }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const isSignup = mode === 'signup' // Determine if we're in signup mode

  /* Basic client-side validation before notifying the parent */
  const submit = () => {
    if (isSignup && !name.trim()) return setError('Please enter your name.')
    if (!email.trim())            return setError('Please enter your email.')
    if (!password)                return setError('Please enter a password.')
    setError('')
    onSubmit({ name, email })
  }

  return (
    <div className="auth-layout">

      {/* ---- Left dark branding panel ---- */}
      <div className="auth-brand">
        <div className="auth-brand__logo">
          <div className="auth-brand__logo-icon">B</div>
          <span className="auth-brand__logo-name">{brand}</span>
        </div>

        <div>
          <div className="auth-brand__headline">
            Every euro, dollar &amp; pound — in focus.
          </div>
          <p className="auth-brand__subtitle">
            Track spending, set a budget for every category, and see exactly
            where your money goes each month.
          </p>
        </div>

        <div className="auth-brand__footer">© 2026 {brand}. A budgeting demo.</div>
      </div>

      {/* ---- Right white form panel ---- */}
      <div className="auth-form-panel">
        <div className="auth-form">
          <h1 className="auth-form__title">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="auth-form__subtitle">
            {isSignup
              ? 'Start tracking your money in minutes.'
              : 'Sign in to your budget dashboard.'}
          </p>

          {/* Name field only shown during sign-up */}
          {isSignup && (
            <>
              <label className="auth-form__label">Full name</label>
              <input
                className="auth-form__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
              />
            </>
          )}

          <label className="auth-form__label">Email</label>
          <input
            className="auth-form__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />

          <label className="auth-form__label">Password</label>
          <input
            type="password"
            className="auth-form__input auth-form__input--last"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* Inline validation error */}
          {error && <div className="auth-form__error">{error}</div>}

          <button className="auth-form__submit" onClick={submit}>
            {isSignup ? 'Create account' : 'Sign in'}
          </button>

          {/* Toggle between login and signup */}
          <div className="auth-form__toggle">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="auth-form__toggle-btn" onClick={onToggle}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
