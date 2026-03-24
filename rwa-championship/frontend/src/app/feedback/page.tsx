'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const QUESTIONS = [
  {
    id: 'q1',
    question: 'How easy was it to register and connect your wallet?',
    type: 'rating',
  },
  {
    id: 'q2',
    question: 'Did your trades appear on the leaderboard correctly?',
    type: 'yesno',
  },
  {
    id: 'q3',
    question: 'Did the RAR scoring feel fairer than a regular PnL leaderboard?',
    type: 'yesno',
  },
  {
    id: 'q4',
    question: 'How would you rate the overall experience?',
    type: 'rating',
  },
  {
    id: 'q5',
    question: 'What would you improve or add to the competition?',
    type: 'text',
  },
  {
    id: 'q6',
    question: 'Would you participate in a future RWA Championship season?',
    type: 'yesno',
  },
  {
    id: 'q7',
    question: 'Any other feedback?',
    type: 'text',
  },
]

export default function FeedbackPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [walletAddress, setWalletAddress] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function setAnswer(id: string, value: any) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address')
      return
    }
    const unanswered = QUESTIONS.filter(q => q.type !== 'text' && !answers[q.id])
    if (unanswered.length > 0) {
      setError('Please answer all required questions')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: dbError } = await supabase.from('feedback').insert({
      wallet_address: walletAddress.trim(),
      q1_wallet_ease: answers.q1,
      q2_trades_correct: answers.q2,
      q3_rar_fairer: answers.q3,
      q4_overall_rating: answers.q4,
      q5_improvements: answers.q5 || null,
      q6_would_return: answers.q6,
      q7_other: answers.q7 || null,
      submitted_at: new Date().toISOString(),
    })

    if (dbError) {
      setError('Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: 'var(--accent-green)' }}>
            Thank You!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', marginBottom: 24, lineHeight: 1.6 }}>
            Your feedback helps improve the RWA Championship. We appreciate you taking the time.
          </p>
          <button onClick={() => router.push('/')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
            Back to Leaderboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--accent-green)', padding: '3px 8px', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
            TEST COMPETITION FEEDBACK
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 800, marginBottom: 8 }}>
            Share Your <span style={{ color: 'var(--accent-green)' }}>Feedback</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', lineHeight: 1.6 }}>
            Help us improve the RWA Championship. Takes 2 minutes.
          </p>
        </div>

        {/* Wallet address */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
            YOUR WALLET ADDRESS *
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={e => setWalletAddress(e.target.value)}
            placeholder="e.g. 4xv9GPT..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>
                <span style={{ color: 'var(--accent-green)', marginRight: 8 }}>0{i + 1}</span>
                {q.question}
                {q.type !== 'text' && <span style={{ color: 'var(--negative)', marginLeft: 4 }}>*</span>}
              </div>

              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setAnswer(q.id, n)} style={{
                      width: 44, height: 44, borderRadius: 8,
                      border: `1px solid ${answers[q.id] === n ? 'var(--accent-green)' : 'var(--border)'}`,
                      background: answers[q.id] === n ? 'rgba(0,212,170,0.1)' : 'var(--bg)',
                      color: answers[q.id] === n ? 'var(--accent-green)' : 'var(--text-secondary)',
                      fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.9rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {n}
                    </button>
                  ))}
                  <span style={{ alignSelf: 'center', fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                    1 = Poor · 5 = Excellent
                  </span>
                </div>
              )}

              {q.type === 'yesno' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setAnswer(q.id, opt)} style={{
                      padding: '8px 24px', borderRadius: 8,
                      border: `1px solid ${answers[q.id] === opt ? 'var(--accent-green)' : 'var(--border)'}`,
                      background: answers[q.id] === opt ? 'rgba(0,212,170,0.1)' : 'var(--bg)',
                      color: answers[q.id] === opt ? 'var(--accent-green)' : 'var(--text-secondary)',
                      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Optional — share your thoughts..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,96,96,0.1)', border: '1px solid rgba(255,96,96,0.3)', color: 'var(--negative)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', marginTop: 24, padding: '14px', borderRadius: 10, border: 'none', background: submitting ? 'rgba(0,212,170,0.4)' : 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>

      </div>
    </div>
  )
}
