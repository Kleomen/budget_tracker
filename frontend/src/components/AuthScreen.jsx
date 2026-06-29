import { useState } from 'react'
import { isValidEmail, passwordStrength, passwordProblem } from '../validators.js'
import './AuthScreen.css'

/* ============================================================
   AuthScreen
   Renders either the login or signup form depending on `mode`.
   On submit it calls onSubmit (which talks to the backend) and shows
   any error it throws — e.g. "Invalid email or password".
   ============================================================ */
export default function AuthScreen({ mode, brand, onToggle, onSubmit, onResend }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [notice, setNotice]     = useState('')    // success message (e.g. "check your inbox")
  const [canResend, setCanResend] = useState(false) // offer a "resend link" button
  const [busy, setBusy]         = useState(false) // true while the request is in flight

  const isSignup = mode === 'signup' // Determine if we're in signup mode

  /* Client-side validation, then hand off to the parent. onSubmit returns a
     promise; if it rejects (bad credentials, email taken, server down) we show
     the message instead of letting the user through. */
  const submit = async () => {
    if (isSignup && !name.trim())     return setError('Please enter your name.')
    if (!isValidEmail(email))         return setError('Please enter a valid email address.')
    if (!password)                    return setError('Please enter a password.')
    // Strength is only enforced on signup; existing logins keep whatever they have.
    if (isSignup) {
      const pwProblem = passwordProblem(password)
      if (pwProblem) return setError(pwProblem)
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const res = await onSubmit({ name, email, password })
      // Login navigates away on success; signup stays here and shows a notice
      // telling the user to go verify their email.
      if (isSignup) {
        setNotice(res?.message || 'Account created — check your email to verify your address.')
        setCanResend(true)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      // Login was refused because the email isn't verified — let them resend.
      if (err.data?.needsVerification) setCanResend(true)
    } finally {
      setBusy(false)
    }
  }

  /* Re-send the verification email to whatever's in the email field. */
  const resend = async () => {
    if (!isValidEmail(email)) return setError('Enter your email above, then resend.')
    setError('')
    setBusy(true)
    try {
      const res = await onResend(email)
      setNotice(res?.message || 'Verification link sent — check your inbox.')
    } catch (err) {
      setError(err.message || 'Could not resend the link. Please try again.')
    } finally {
      setBusy(false)
    }
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

          {/* Strength meter — signup only, once the user starts typing. 4 bars
              fill and recolour with the score (data-score drives the CSS). */}
          {isSignup && password && (() => {
            const { score, label } = passwordStrength(password)
            return (
              <div className="pw-strength" data-score={score}>
                <div className="pw-strength__bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`pw-strength__bar ${i < score ? 'is-on' : ''}`} />
                  ))}
                </div>
                <span className="pw-strength__label">{label}</span>
              </div>
            )
          })()}

          {/* Inline validation error */}
          {error && <div className="auth-form__error">{error}</div>}

          {/* Success notice (e.g. after signup: "check your inbox") */}
          {notice && <div className="auth-form__notice">{notice}</div>}

          <button className="auth-form__submit" onClick={submit} disabled={busy}>
            {busy
              ? (isSignup ? 'Creating account…' : 'Signing in…')
              : (isSignup ? 'Create account' : 'Sign in')}
          </button>

          {/* Shown after signup, or when login is blocked for an unverified email. */}
          {canResend && (
            <button className="auth-form__resend" onClick={resend} disabled={busy}>
              Resend verification email
            </button>
          )}

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
