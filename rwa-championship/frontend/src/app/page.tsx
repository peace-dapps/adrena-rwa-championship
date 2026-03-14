'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import WalletButton from '../components/WalletButton'

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
  equities:    { label: 'Equities',    icon: '📈', desc: 'AAPL · TSLA · NVDA', color: '#00D4AA', glow: '0 0 20px rgba(0,212,170,0.3)',   bg: 'rgba(0,212,170,0.06)',   border: 'rgba(0,212,170,0.2)'   },
  commodities: { label: 'Commodities', icon: '⚡', desc: 'GOLD · OIL · SILVER', color: '#F5A623', glow: '0 0 20px rgba(245,166,35,0.3)',  bg: 'rgba(245,166,35,0.06)',  border: 'rgba(245,166,35,0.2)'  },
  baskets:     { label: 'Baskets',     icon: '🧺', desc: 'EV METALS · SEMIS',   color: '#B06EFF', glow: '0 0 20px rgba(176,110,255,0.3)', bg: 'rgba(176,110,255,0.06)', border: 'rgba(176,110,255,0.2)' },
}

const tw = (w: string) => `${w.slice(0,4)}...${w.slice(-4)}`
const fp = (p: number) => `${p>=0?'+':''}$${Math.abs(p).toLocaleString('en-US',{maximumFractionDigits:0})}`

function Badge({ rank }: { rank: number }) {
  const m: Record<number,string> = {1:'🥇',2:'🥈',3:'🥉'}
  return m[rank]
    ? <span style={{fontSize:'1.2rem'}}>{m[rank]}</span>
    : <span style={{fontFamily:'monospace',fontSize:'0.85rem',color:'#666',fontWeight:700}}>#{rank}</span>
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{-webkit-text-size-adjust:100%}
        body{background:#080B10;color:#E8EAF0;font-family:'Syne',sans-serif;overflow-x:hidden}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .renter{animation:fadeUp 0.25s ease forwards}
        .rbtn{background:none;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .rrow{cursor:pointer;transition:background 0.15s;-webkit-tap-highlight-color:transparent}
        .rrow:hover{background:rgba(255,255,255,0.03)!important}
        .rrow:active{background:rgba(255,255,255,0.07)!important}
        .scroll-x{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none}
        .scroll-x::-webkit-scrollbar{display:none}
        /* desktop table */
        .dt{display:grid}
        .mr{display:none}
        /* mobile */
        @media(max-width:600px){
          .dt{display:none!important}
          .mr{display:flex!important}
          .sgrid{grid-template-columns:repeat(2,1fr)!important}
          .hdr-top{flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
          .hdr-right{width:100%}
        }
      `}</style>

      <div style={{minHeight:'100vh',background:'#080B10',position:'relative',overflowX:'hidden'}}>
        <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:`linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,backgroundSize:'48px 48px'}}/>
        <div style={{position:'fixed',top:-150,left:'50%',transform:'translateX(-50%)',width:400,height:400,borderRadius:'50%',zIndex:0,pointerEvents:'none',background:`radial-gradient(circle,${cfg.color}12 0%,transparent 70%)`,transition:'background 0.5s'}}/>

        <div style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'0 16px 60px'}}>

          {/* HEADER */}
          <div style={{paddingTop:20,paddingBottom:16}}>
            <div className="hdr-top" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,gap:8}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.12em',color:cfg.color,padding:'3px 8px',border:`1px solid ${cfg.color}40`,borderRadius:3,flexShrink:0}}>
                ADRENA × AUTONOM
              </div>
              <div className="hdr-right" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                {session && (
                  <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:999,background:isOpen?'rgba(0,212,170,0.1)':'rgba(255,80,80,0.1)',border:`1px solid ${isOpen?'rgba(0,212,170,0.3)':'rgba(255,80,80,0.3)'}`}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:isOpen?'#00D4AA':'#FF5050',display:'inline-block',animation:isOpen?'pulse 2s infinite':'none'}}/>
                    <span style={{fontSize:'0.68rem',fontWeight:600,color:isOpen?'#00D4AA':'#FF5050',whiteSpace:'nowrap'}}>
                      {isOpen?`${hrs}h ${mins}m left`:'CLOSED'}
                    </span>
                  </div>
                )}
                <WalletButton />
              </div>
            </div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(1.6rem,7vw,3rem)',fontWeight:800,letterSpacing:'-0.02em',lineHeight:1.05,marginBottom:4}}>
              RWA <span style={{color:cfg.color}}>Championship</span>
            </h1>
            <p style={{color:'#666',fontSize:'clamp(0.65rem,2.5vw,0.82rem)',fontFamily:"'Space Mono',monospace"}}>
              Season 1 · Week {session?.week_number??1} · Skill over capital
            </p>
          </div>

          {/* TABS */}
          <div className="scroll-x" style={{marginBottom:16}}>
            {(Object.entries(LC) as [League, typeof LC.equities][]).map(([key,c])=>(
              <button key={key} className="rbtn" onClick={()=>setLeague(key)} style={{padding:'8px 14px',borderRadius:8,flexShrink:0,border:`1px solid ${key===league?c.color:'rgba(255,255,255,0.08)'}`,background:key===league?c.bg:'rgba(255,255,255,0.03)',color:key===league?c.color:'#777',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.82rem',boxShadow:key===league?c.glow:'none',display:'flex',alignItems:'center',gap:6}}>
                <span>{c.icon}</span><span>{c.label}</span>
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
                <div key={s.label} style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{fontSize:'0.55rem',fontFamily:"'Space Mono',monospace",color:'#555',letterSpacing:'0.1em',marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:'clamp(0.9rem,3vw,1.2rem)',fontWeight:700,color:cfg.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE */}
          <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${cfg.border}`,background:'rgba(255,255,255,0.02)'}}>
            {/* Desktop header */}
            <div className="dt" style={{gridTemplateColumns:'44px 1fr 110px 95px 70px 70px 80px',padding:'10px 16px',background:cfg.bg,borderBottom:`1px solid ${cfg.border}`,fontSize:'0.6rem',fontFamily:"'Space Mono',monospace",color:'#555',letterSpacing:'0.1em'}}>
              <span>RANK</span><span>TRADER</span>
              <span style={{textAlign:'right'}}>RAR</span>
              <span style={{textAlign:'right'}}>PNL</span>
              <span style={{textAlign:'right'}}>TRADES</span>
              <span style={{textAlign:'right'}}>WIN%</span>
              <span style={{textAlign:'right'}}>PTS</span>
            </div>

            {loading?(
              <div style={{padding:48,textAlign:'center',color:'#444',fontFamily:"'Space Mono',monospace",fontSize:'0.8rem'}}>Loading...</div>
            ):entries.length===0?(
              <div style={{padding:48,textAlign:'center',color:'#444',fontFamily:"'Space Mono',monospace",fontSize:'0.8rem'}}>No trades yet. Be first to compete.</div>
            ):entries.map((e,i)=>(
              <div key={e.wallet_address} className="renter rrow" onClick={()=>router.push(`/trader/${e.wallet_address}`)}
                style={{animationDelay:`${i*0.03}s`,padding:'0 16px',borderBottom:i<entries.length-1?'1px solid rgba(255,255,255,0.04)':'none',background:i<3?cfg.bg:'transparent'}}>

                {/* Desktop row */}
                <div className="dt" style={{gridTemplateColumns:'44px 1fr 110px 95px 70px 70px 80px',alignItems:'center',padding:'12px 0'}}>
                  <div style={{display:'flex',justifyContent:'center'}}><Badge rank={e.rank??i+1}/></div>
                  <div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',fontWeight:700}}>{tw(e.wallet_address)}</div>
                    {e.streak_bonus>1&&<div style={{fontSize:'0.65rem',color:'#F5A623',marginTop:2}}>🔥 {((e.streak_bonus-1)*10).toFixed(0)}% streak</div>}
                  </div>
                  <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.95rem',fontWeight:700,color:cfg.color}}>{e.rar_score.toFixed(2)}%</div>
                  <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:e.total_pnl_normalized>=0?'#00D4AA':'#FF6060',fontWeight:600}}>{fp(e.total_pnl_normalized)}</div>
                  <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'#888'}}>{e.trade_count}</div>
                  <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'#888'}}>{(e.win_rate*100).toFixed(0)}%</div>
                  <div style={{textAlign:'right',fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',color:'#fff',fontWeight:700}}>{e.championship_points??0}</div>
                </div>

                {/* Mobile row */}
                <div className="mr" style={{alignItems:'center',justifyContent:'space-between',padding:'12px 0',gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                    <Badge rank={e.rank??i+1}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.82rem',fontWeight:700}}>{tw(e.wallet_address)}</div>
                      <div style={{fontSize:'0.65rem',color:'#888',marginTop:2}}>{e.trade_count} trades · {(e.win_rate*100).toFixed(0)}% win</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'1rem',fontWeight:700,color:cfg.color}}>{e.rar_score.toFixed(1)}%</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.72rem',color:e.total_pnl_normalized>=0?'#00D4AA':'#FF6060'}}>{fp(e.total_pnl_normalized)}</div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div style={{marginTop:16,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
            <p style={{fontSize:'0.68rem',color:'#444',fontFamily:"'Space Mono',monospace"}}>
              Autonom CAN prices · QRNG raffles · 60s updates
            </p>
            <button className="rbtn" onClick={()=>router.push('/raffle')} style={{border:'1px solid rgba(176,110,255,0.3)',borderRadius:6,color:'#B06EFF',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',padding:'6px 14px',background:'none',cursor:'pointer'}}>
              🎰 Weekly Raffle →
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
