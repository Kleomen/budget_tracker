/* Auth field checks, shared by the signup form (live meter) and submit guard.
   ponytail: heuristic strength score, not zxcvbn — swap it in if this ever
   proves too weak. The backend re-validates; this is just UX. */

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

/* Returns { score: 0-4, label }. A password under 8 chars can never look
   strong, so the score is clamped — long-enough length is the floor for trust. */
export const passwordStrength = (pw) => {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length < 8) score = Math.min(score, 1)
  score = Math.min(score, 4)
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}

/* The accept/reject rule. Returns an error message, or null when the password
   is acceptable: at least 8 chars and not the weakest tier. */
export const passwordProblem = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (passwordStrength(pw).score < 2) return 'Password is too weak — mix in capitals, numbers, or symbols.'
  return null
}
