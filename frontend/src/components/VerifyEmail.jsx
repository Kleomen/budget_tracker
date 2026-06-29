import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../api.js'
import './AuthScreen.css'

/* ============================================================
   VerifyEmail
   The page the email link points at (/verify?token=...). It POSTs the token
   to the backend; on success the user is signed straight in (onVerified gets
   { token, user }), otherwise it shows the error with a way back to sign in.
   ============================================================ */
export default function VerifyEmail({ brand, onVerified, onResend }) {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('working') // 'working' | 'error'
  const [error, setError]   = useState('')
  const navigate = useNavigate()
  const ran = useRef(false) // guard against StrictMode's double-invoke in dev

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setError('This link is missing its verification token.')
      return
    }
    api.verifyEmail(token)
      .then((data) => onVerified(data)) // signs in and navigates to /dashboard
      .catch((err) => {
        setStatus('error')
        setError(err.message || 'We could not verify this link.')
      })
  }, [])

  return (
    <div className="verify-screen">
      <div className="verify-card">
        <div className="auth-brand__logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="auth-brand__logo-icon">B</div>
          <span className="auth-brand__logo-name" style={{ color: 'var(--ink)' }}>{brand}</span>
        </div>

        {status === 'working' ? (
          <>
            <h1 className="auth-form__title">Verifying your email…</h1>
            <p className="auth-form__subtitle">One moment while we confirm your account.</p>
          </>
        ) : (
          <>
            <h1 className="auth-form__title">Verification failed</h1>
            <div className="auth-form__error">{error}</div>
            <button className="auth-form__submit" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
