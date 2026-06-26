import './Card.css'

/* Generic white card surface.
   `style` is passed through for dynamic layout values (e.g. gridColumn). */
export default function Card({ children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}
