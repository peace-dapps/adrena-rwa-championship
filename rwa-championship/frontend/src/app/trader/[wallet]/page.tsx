'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'
import { ThemeToggle } from '../../../components/ThemeProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ACHIEVEMENTS = [
  { key: 'equity_analyst',    name: 'Equity Analyst',    desc: '10+ equity trades',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { key: 'commodity_trader',  name: 'Commodity Trader',  desc: '10+ commodity trades',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { key: 'basket_weaver',     name: 'Basket Weaver',     desc: 'First basket trade',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg> },
  { key: 'rwa_leviathan',     name: 'RWA Leviathan',     desc: 'Top 3 in any league',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'consistent',        name: 'Consistent',        desc: '70%+ win rate, 10 trades', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg> },
  { key: 'streak_master',     name: 'Streak Master',     desc: '3 week streak',          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
]

const LEAGUE_COLORS: Record<string,string> = {
  equities: 'var(--accent-green)',
  commodities: 'var(--accent-orange)',
  baskets: 'var(--accent-purple)',
}

function truncate(w: string) { return `${w.slice(0,6)}...${w.slice(-6)}` }

export default function TraderProfile() {
  const params = useParams()
  const router = useRouter()
  const wallet = decodeURIComponent(params.wallet as string)

  const [trader, setTrader] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }, { data: p }, { data: a }] = await Promise.all([
        supabase.from('traders').select('*').eq('wallet_address',wallet).single(),
        supabase.from('leaderboard_scores').select('*').eq('wallet_address',wallet).order('updated_at',{ascending:false}),
        supabase.from('positions').select('*').eq('wallet_address',wallet).order('exit_date',{ascending:false}).limit(20),
        supabase.from('trader_achievements').select('*').eq('wallet_address',wallet),
      ])
      setTrader(t); setScores(s||[]); setPositions(p||[]); setAchievements(a||[])
      setLoading(false)
    }
    load()
  }, [wallet])

  const totalRar = scores.reduce((sum,s)=>sum+(s.rar_score||0),0)
  const totalPnl = scores.reduce((sum,s)=>sum+(s.total_pnl_normalized||0),0)
  const totalTrades = scores.reduce((sum,s)=>sum+(s.trade_count||0),0)
  const totalPoints = scores.reduce((sum,s)=>sum+(s.championship_points||0),0)
  const avgWinRate = scores.length>0 ? scores.reduce((sum,s)=>sum+(s.win_rate||0),0)/scores.length : 0

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text-primary)'}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px 80px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:'0.8rem',display:'flex',alignItems:'center',gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <ThemeToggle />
        </div>

        {loading ? (
          <div style={{color:'var(--text-muted)',fontFamily:"'Space Mono',monospace"}}>Loading...</div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{padding:28,borderRadius:16,background:'var(--bg-card)',border:'1px solid var(--border)',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
                <div>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'1.8rem',fontWeight:800,marginBottom:4}}>
                    {trader?.display_name||truncate(wallet)}
                  </h1>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:4}}>{wallet}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.7rem',color:'var(--text-muted)'}}>
                    Registered {trader?.registered_at?new Date(trader.registered_at).toLocaleDateString():'—'}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'2.5rem',fontWeight:800,color:'var(--accent-green)'}}>{totalPoints}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',color:'var(--text-muted)',letterSpacing:'0.1em'}}>CHAMPIONSHIP PTS</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
              {[
                {label:'TOTAL RAR',value:`${totalRar.toFixed(2)}%`,color:'var(--accent-green)'},
                {label:'TOTAL PNL',value:`${totalPnl>=0?'+':''}$${Math.abs(totalPnl).toFixed(0)}`,color:totalPnl>=0?'var(--positive)':'var(--negative)'},
                {label:'TOTAL TRADES',value:totalTrades,color:'var(--text-primary)'},
                {label:'AVG WIN RATE',value:`${(avgWinRate*100).toFixed(0)}%`,color:'var(--accent-orange)'},
              ].map(stat=>(
                <div key={stat.label} style={{padding:'16px 18px',borderRadius:10,background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:'0.62rem',fontFamily:"'Space Mono',monospace",color:'var(--text-muted)',letterSpacing:'0.12em',marginBottom:6}}>{stat.label}</div>
                  <div style={{fontSize:'1.4rem',fontWeight:700,color:stat.color}}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* League scores */}
            {scores.length>0&&(
              <div style={{marginBottom:20}}>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:'1rem',fontWeight:700,marginBottom:12,color:'var(--text-secondary)'}}>LEAGUE SCORES</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
                  {scores.map(score=>(
                    <div key={score.id} style={{padding:'18px 20px',borderRadius:10,background:'var(--bg-card)',border:`1px solid ${LEAGUE_COLORS[score.league]||'var(--border)'}30`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.85rem',color:LEAGUE_COLORS[score.league]}}>{score.league?.toUpperCase()}</span>
                        {score.rank&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'var(--text-muted)'}}>Rank #{score.rank}</span>}
                      </div>
                      <div style={{fontSize:'1.6rem',fontWeight:800,color:LEAGUE_COLORS[score.league],marginBottom:8}}>{score.rar_score?.toFixed(2)}%</div>
                      <div style={{display:'flex',gap:16}}>
                        {[{l:'TRADES',v:score.trade_count},{l:'WIN%',v:`${((score.win_rate||0)*100).toFixed(0)}%`},{l:'PTS',v:score.championship_points}].map(item=>(
                          <div key={item.l}>
                            <div style={{fontSize:'0.6rem',color:'var(--text-muted)',fontFamily:"'Space Mono',monospace"}}>{item.l}</div>
                            <div style={{fontSize:'0.9rem',color:'var(--text-secondary)'}}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:'1rem',fontWeight:700,marginBottom:12,color:'var(--text-secondary)'}}>ACHIEVEMENTS</h2>
              <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                {ACHIEVEMENTS.map(ach=>{
                  const unlocked = achievements.some(a=>a.achievement_key===ach.key)
                  return (
                    <div key={ach.key} style={{padding:'10px 16px',borderRadius:8,background:unlocked?'rgba(0,212,170,0.08)':'var(--bg-card)',border:`1px solid ${unlocked?'rgba(0,212,170,0.3)':'var(--border)'}`,opacity:unlocked?1:0.4,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{color:unlocked?'var(--accent-green)':'var(--text-muted)'}}>{ach.icon}</span>
                      <div>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:'0.8rem',fontWeight:700,color:unlocked?'var(--text-primary)':'var(--text-muted)'}}>{ach.name}</div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',color:'var(--text-muted)'}}>{ach.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent trades */}
            {positions.length>0&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:'1rem',fontWeight:700,marginBottom:12,color:'var(--text-secondary)'}}>RECENT TRADES</h2>
                <div style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--border)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'80px 80px 1fr 100px 80px',padding:'10px 16px',background:'var(--bg-card)',fontSize:'0.62px',fontFamily:"'Space Mono',monospace",color:'var(--text-muted)',letterSpacing:'0.08em',fontSize:'0.62rem'}}>
                    <span>SYMBOL</span><span>SIDE</span><span>DATE</span><span style={{textAlign:'right'}}>PNL</span><span style={{textAlign:'right'}}>LEV</span>
                  </div>
                  {positions.map((pos,i)=>(
                    <div key={pos.id} style={{display:'grid',gridTemplateColumns:'80px 80px 1fr 100px 80px',padding:'12px 16px',borderTop:'1px solid var(--border)',alignItems:'center'}}>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)'}}>{pos.symbol}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:pos.side==='long'?'var(--positive)':'var(--negative)',fontWeight:700}}>{pos.side?.toUpperCase()}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'var(--text-muted)'}}>{pos.exit_date?new Date(pos.exit_date).toLocaleDateString():'—'}</span>
                      <span style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.85rem',color:(pos.pnl_normalized||pos.pnl||0)>=0?'var(--positive)':'var(--negative)',fontWeight:600}}>
                        {(pos.pnl_normalized||pos.pnl||0)>=0?'+':''}${Math.abs(pos.pnl_normalized||pos.pnl||0).toFixed(0)}
                      </span>
                      <span style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'var(--text-muted)'}}>{pos.entry_leverage?.toFixed(1)}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
