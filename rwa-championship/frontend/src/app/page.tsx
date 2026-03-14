'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import WalletButton from '../components/WalletButton'
import { ThemeToggle } from '../components/ThemeProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type League = 'equities' | 'commodities' | 'baskets'

interface LeaderboardEntry {
  rank: number
  wallet_address: string
  rar_score: number
  total_pnl_normalized: number
  trade_count: number
  win_rate: number
  streak_bonus: number
  championship_points: number
}

interface SessionInfo {
  id: string
  league: League
  status: string
  start_time: string
  end_time: string
  week_number: number
}

const LC = {
  equities:    { label: 'Equities',    color: 'var(--accent-green)',  glow: '0 0 20px rgba(0,212,170,0.25)',   bg: 'rgba(0,212,170,0.06)',   border: 'rgba(0,212,170,0.2)'   },
  commodities: { label: 'Commodities', color: 'var(--accent-orange)', glow: '0 0 20px rgba(245,166,35,0.25)',  bg: 'rgba(245,166,35,0.06)',  border: 'rgba(245,166,35,0.2)'  },
  baskets:     { label: 'Baskets',     color: 'var(--accent-purple)', glow: '0 0 20px rgba(176,110,255,0.25)', bg: 'rgba(176,110,255,0.06)', border: 'rgba(176,110,255,0.2)' },
}

const LEAGUE_ICONS = {
  equities: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  commodities: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  baskets: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
      <rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/>
    </svg>
  ),
}

const tw = (w: string) => `${w.slice(0,4)}...${w.slice(-4)}`
const fp = (p: number) => `${p>=0?'+':''}$${Math.abs(p).toLocaleString('en-US',{maximumFractionDigits:0})}`

function Badge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{fontSize:'1.2rem'}}>🥇</span>
  if (rank === 2) return <span style={{fontSize:'1.2rem'}}>🥈</span>
  if (rank === 3) return <span style={{fontSize:'1.2rem'}}>🥉</span>
  return <span style={{fontFamily:'monospace',fontSize:'0.85rem',color:'var(--text-muted)',fontWeight:700}}>#{rank}</span>
}

export default function Page() {
  const router = useRouter()
  const [league, setLeague] = useState<League>('equities')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [session, setSession] = useState<SessionInfo|null>(null)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState(new Date())
  const cfg = LC[league]

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('sessions').select('*').eq('league',league).in('status',['active','market_closed']).order('week_number',{ascending:false}).limit(1).single()
    if (!s) { setEntries([]); setSession(null); setLoading(false); return }
    setSession(s)
    const { data: sc } = await supabase.from('leaderboard_scores').select('*').eq('session_id',s.id).eq('league',league).order('rar_score',{ascending:false}).limit(50)
    setEntries(sc||[])
    setUpdated(new Date())
    setLoading(false)
  }, [league])

  useEffect(() => {
    setLoading(true); load()
    const ch = supabase.channel(`lb:${league}`).on('postgres_changes',{event:'*',schema:'public',table:'leaderboard_scores',filter:`league=eq.${league}`},()=>load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [league, load])

  const diff = session ? new Date(session.end_time).getTime() - Date.now() : 0
  const hrs = Math.floor(diff/3600000)
  const mins = Math.floor((diff%3600000)/60000)
  const isOpen = session?.status === 'active'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',position:'relative',overflowX:'hidden'}}>
      {/* Background grid */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:`linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)`,backgroundSize:'48px 48px',opacity:0.5}}/>
      <div style={{position:'fixed',top:-150,left:'50%',transform:'translateX(-50%)',width:400,height:400,borderRadius:'50%',zIndex:0,pointerEvents:'none',background:`radial-gradient(circle,${cfg.color}12 0%,transparent 70%)`,transition:'background 0.5s'}}/>

      <div style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'0 16px 60px'}}>

        {/* HEADER */}
        <div style={{paddingTop:20,paddingBottom:16}}>
          <div className="hdr-top" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,gap:8,flexWrap:'wrap'}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.12em',color:cfg.color,padding:'3px 8px',border:`1px solid ${cfg.color}40`,borderRadius:3,flexShrink:0}}>
              ADRENA × AUTONOM
            </div>
            <div className="hdr-right" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
              {session && (
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:999,background:isOpen?'rgba(0,212,170,0.1)':'rgba(255,80,80,0.1)',border:`1px solid ${isOpen?'rgba(0,212,170,0.3)':'rgba(255,80,80,0.3)'}`}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:isOpen?'var(--accent-green)':'#FF5050',display:'inline-block',animation:isOpen?'pulse 2s infinite':'none',flexShrink:0}}/>
                  <span style={{fontSize:'0.68rem',fontWeight:600,color:isOpen?'var(--accent-green)':'#FF5050',whiteSpace:'nowrap'}}>
                    {isOpen?`${hrs}h ${mins}m left`:'CLOSED'}
                  </span>
                </div>
              )}
          <ThemeToggle />
              <WalletButton />
            </div>
          </div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.6rem,7vw,3rem)',fontWeight:800,letterSpacing:'-0.02em',lineHeight:1.05,marginBottom:4,color:'var(--text-primary)'}}>
            RWA <span style={{color:cfg.color}}>Championship</span>
          </h1>
          <p style={{color:'var(--text-secondary)',fontSize:'clamp(0.65rem,2.5vw,0.82rem)',fontFamily:"'Space Mono',monospace"}}>
            Season 1 · Week {session?.week_number??1} · Skill over capital
          </p>
        </div>

        {/* LEAGUE TABS */}
        <div className="scroll-x" style={{marginBottom:16}}>
          {(Object.entries(LC) as [League, typeof LC.equities][]).map(([key,c])=>(
            <button key={key} className="rbtn" onClick={()=>setLeague(key)} style={{
              padding:'8px 14px',borderRadius:8,flexShrink:0,
              border:`1px solid ${key===league?c.color:'var(--border)'}`,
              background:key===league?c.bg:'var(--bg-card)',
              color:key===league?c.color:'var(--text-muted)',
              fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.82rem',
              boxShadow:key===league?c.glow:'none',
              display:'flex',alignItems:'center',gap:6,
              transition:'all 0.2s'
            }}>
              <span style={{color:key===league?c.color:'var(--text-muted)'}}>{LEAGUE_ICONS[key]}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* STATS */}
        {session&&(
          <div className="sgrid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
            {[
              {label:'TRADERS',value:entries.length},
              {label:'TOP RAR',value:entries[0]?`${entries[0].rar_score.toFixed(1)}%`:'—'},
              {label:'WEEK',value:`#${session.week_number}`},
              {label:'UPDATED',value:updated.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},
            ].map(s=>(
              <div key={s.label} style={{padding:'10px 12px',borderRadius:8,background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                <div style={{fontSize:'0.55rem',fontFamily:"'Space Mono',monospace",color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:'clamp(0.9rem,3vw,1.2rem)',fontWeight:700,color:cfg.color}}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${cfg.border}`,background:'var(--bg-card)'}}>
          {/* Desktop header */}
          <div className="dt" style={{gridTemplateColumns:'44px 1fr 110px 95px 70px 70px 80px',padding:'10px 16px',background:cfg.bg,borderBottom:`1px solid ${cfg.border}`,fontSize:'0.6rem',fontFamily:"'Space Mono',monospace",color:'var(--text-muted)',letterSpacing:'0.1em'}}>
            <span>RANK</span><span>TRADER</span>
            <span style={{textAlign:'right'}}>RAR</span>
            <span style={{textAlign:'right'}}>PNL</span>
            <span style={{textAlign:'right'}}>TRADES</span>
            <span style={{textAlign:'right'}}>WIN%</span>
            <span style={{textAlign:'right'}}>PTS</span>
          </div>

          {loading?(
            <div style={{padding:48,textAlign:'center',color:'var(--text-muted)',fontFamily:"'Space Mono',monospace",fontSize:'0.8rem'}}>Loading...</div>
          ):entries.length===0?(
            <div style={{padding:48,textAlign:'center',color:'var(--text-muted)',fontFamily:"'Space Mono',monospace",fontSize:'0.8rem'}}>No trades yet. Be first to compete.</div>
          ):entries.map((e,i)=>(
            <div key={e.wallet_address} className="renter rrow" onClick={()=>router.push(`/trader/${e.wallet_address}`)}
              style={{animationDelay:`${i*0.03}s`,padding:'0 16px',borderBottom:i<entries.length-1?'1px solid var(--border)':'none',background:i<3?cfg.bg:'transparent'}}>

              {/* Desktop row */}
              <div className="dt" style={{gridTemplateColumns:'44px 1fr 110px 95px 70px 70px 80px',alignItems:'center',padding:'12px 0'}}>
                <div style={{display:'flex',justifyContent:'center'}}><Badge rank={e.rank??i+1}/></div>
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',fontWeight:700,color:'var(--text-primary)'}}>{tw(e.wallet_address)}</div>
                  {e.streak_bonus>1&&<div style={{fontSize:'0.65rem',color:'var(--accent-orange)',marginTop:2}}>+{((e.streak_bonus-1)*10).toFixed(0)}% streak</div>}
                </div>
                <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.95rem',fontWeight:700,color:cfg.color}}>{e.rar_score.toFixed(2)}%</div>
                <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:e.total_pnl_normalized>=0?'var(--positive)':'var(--negative)',fontWeight:600}}>{fp(e.total_pnl_normalized)}</div>
                <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'var(--text-secondary)'}}>{e.trade_count}</div>
                <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'var(--text-secondary)'}}>{(e.win_rate*100).toFixed(0)}%</div>
                <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'var(--text-primary)',fontWeight:700}}>{e.championship_points??0}</div>
              </div>

              {/* Mobile row */}
              <div className="mr" style={{alignItems:'center',justifyContent:'space-between',padding:'12px 0',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                  <Badge rank={e.rank??i+1}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',fontWeight:700,color:'var(--text-primary)'}}>{tw(e.wallet_address)}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--text-secondary)',marginTop:2}}>{e.trade_count} trades · {(e.win_rate*100).toFixed(0)}% win</div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'1rem',fontWeight:700,color:cfg.color}}>{e.rar_score.toFixed(1)}%</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.72rem',color:e.total_pnl_normalized>=0?'var(--positive)':'var(--negative)'}}>{fp(e.total_pnl_normalized)}</div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{marginTop:16,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <p style={{fontSize:'0.68rem',color:'var(--text-muted)',fontFamily:"'Space Mono',monospace"}}>
            Autonom CAN prices · QRNG raffles · 60s updates
          </p>
          <div style={{display:'flex',gap:8}}>
            <button className="rbtn" onClick={()=>router.push('/about')} style={{border:'1px solid var(--border)',borderRadius:6,color:'var(--text-secondary)',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',padding:'6px 14px',background:'none',cursor:'pointer'}}>
              How It Works
            </button>
            <button className="rbtn" onClick={()=>router.push('/raffle')} style={{border:'1px solid rgba(176,110,255,0.3)',borderRadius:6,color:'var(--accent-purple)',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',padding:'6px 14px',background:'none',cursor:'pointer'}}>
              Weekly Raffle →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
