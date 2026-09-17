import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine.js';
import { sounds } from '../engine/SoundSystem.js';
import { saveNewScore } from '../../data/leaderboardData.js';

export const GameCanvas = ({ user, gameConfig, onReturnToDashboard }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const character = gameConfig?.character || { name: 'Jangchi Paladin', icon: '⚔️', color: '#38bdf8' };
  const difficulty = gameConfig?.difficulty || { name: 'O‘rtacha', icon: '🟡', color: '#eab308' };
  const zone = gameConfig?.zone || { name: 'Qorong‘u Shahar', icon: '🏙️', color: '#38bdf8' };

  const [gameState, setGameState] = useState({
    hp: 120,
    maxHp: 120,
    xp: 0,
    maxXp: 100,
    level: 1,
    gold: 0,
    kills: 0,
    wave: 1,
    dashCooldown: 0,
    specialCooldown: 0,
    enemiesAlive: 0,
    boss: null,
  });

  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [waveBanner, setWaveBanner] = useState(null);
  const [showStatsCard, setShowStatsCard] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(true);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showHudMiniMap, setShowHudMiniMap] = useState(true);

  const getRankInfo = (kills, wave, gold) => {
    const score = (kills * 25) + (wave * 350) + (gold * 2);
    if (score >= 20000 || wave >= 10) return { rank: 'S+ RANK', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b' };
    if (score >= 10000 || wave >= 6) return { rank: 'A RANK', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.25)', border: '#38bdf8' };
    if (score >= 4000 || wave >= 3) return { rank: 'B RANK', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.25)', border: '#4ade80' };
    return { rank: 'C RANK', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.25)', border: '#94a3b8' };
  };

  const formatTime = (seconds) => {
    const m = Math.floor((seconds || 0) / 60);
    const s = (seconds || 0) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    engineRef.current.resize(width, height);
  }, []);

  // Listen for Pause (P / ESC), Controls Close (X), and Stats Card (TAB / T / M) keypresses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showControlsModal) {
        if (e.key === 'x' || e.key === 'X' || e.key === 'Enter' || e.key === ' ') {
          setShowControlsModal(false);
          return;
        }
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (!isGameOver) {
          if (showStatsCard) {
            setShowStatsCard(false);
          } else {
            togglePause();
          }
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setShowHudMiniMap((prev) => !prev);
      } else if (e.key === 'Tab' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setShowStatsCard((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused, showStatsCard, showControlsModal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas, gameConfig?.character, gameConfig?.difficulty, gameConfig?.zone);
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setGameState(state);
    };

    engine.onGameOver = (stats) => {
      setIsGameOver(true);
      const fullStats = {
        ...stats,
        characterName: character.name,
      };
      setGameOverStats(fullStats);
      engine.pause();

      const score = (fullStats.kills * 25) + (fullStats.wave * 350) + (fullStats.gold * 2);
      const historyEntry = {
        id: Date.now(),
        date: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('uz-UZ'),
        characterName: character.name,
        characterIcon: character.icon,
        characterColor: character.color,
        difficultyName: difficulty.name,
        difficultyIcon: difficulty.icon,
        difficultyColor: difficulty.color,
        kills: fullStats.kills,
        gold: fullStats.gold,
        wave: fullStats.wave,
        timeElapsed: fullStats.timeElapsed || 0,
        score: score,
        rank: getRankInfo(fullStats.kills, fullStats.wave, fullStats.gold).rank,
      };
      try {
        const savedHistory = JSON.parse(localStorage.getItem('zombie_game_history') || '[]');
        localStorage.setItem('zombie_game_history', JSON.stringify([historyEntry, ...savedHistory].slice(0, 30)));
      } catch (e) {}

      if (user) {
        saveNewScore(user, fullStats);
      }
    };

    engine.onWaveBanner = (bannerData) => {
      setWaveBanner(bannerData);
      setTimeout(() => {
        setWaveBanner(null);
      }, 3500);
    };

    engine.start();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [handleResize, gameConfig, user]);

  const togglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setGameOverStats(null);
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (gameState.hp / gameState.maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (gameState.xp / gameState.maxXp) * 100));

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Top Left: Hero Avatar & HP/XP Bars */}
      <div style={styles.topLeftHud}>
        <div style={styles.hudCard}>
          <div style={styles.hpRow}>
            <div style={{ ...styles.heroAvatarBadge, backgroundColor: character.color || '#2563eb' }}>
              {character.icon} Lv.{gameState.level}
            </div>
            <div style={styles.barContainer}>
              <div style={styles.barHeader}>
                <span style={styles.barLabel}>HP ({character.name})</span>
                <span style={styles.barValue}>{gameState.hp} / {gameState.maxHp}</span>
              </div>
              <div style={styles.barBg}>
                <div style={{ ...styles.hpFill, width: `${hpPercent}%` }} />
              </div>
            </div>
          </div>

          <div style={styles.xpRow}>
            <div style={styles.barHeader}>
              <span style={styles.xpLabel}>EXP</span>
              <span style={styles.barValue}>{gameState.xp} / {gameState.maxXp}</span>
            </div>
            <div style={styles.barBg}>
              <div style={{ ...styles.xpFill, width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Center: Boss Health Bar (if active) */}
      {gameState.boss && (
        <div style={styles.bossHud}>
          <div style={styles.bossCard}>
            <div style={styles.bossHeader}>
              <span style={styles.bossName}>{gameState.boss.name}</span>
              <span style={styles.bossPhaseBadge}>
                {gameState.boss.phase === 2 ? 'FAZA 2 (QAZABLI)' : 'FAZA 1'}
              </span>
            </div>
            <div style={styles.bossBarBg}>
              <div
                style={{
                  ...styles.bossBarFill,
                  width: `${Math.max(0, Math.min(100, (gameState.boss.hp / gameState.boss.maxHp) * 100))}%`,
                  backgroundColor: gameState.boss.phase === 2 ? '#ef4444' : '#dc2626',
                }}
              />
            </div>
            <div style={styles.bossHpText}>
              {gameState.boss.hp} / {gameState.boss.maxHp}
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Stats, Pause Button & Live Mini-Map */}
      <div style={styles.topRightHud}>
        <div style={styles.hudStatsCard}>
          <div style={styles.statItem}>
            <span style={{ color: difficulty.color, fontWeight: 'bold', fontSize: '12px' }}>
              {difficulty.icon} {difficulty.name}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>⚔️</span>
            <span style={styles.statText}>Wave {gameState.wave}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💰</span>
            <span style={styles.goldText}>{gameState.gold}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💀</span>
            <span style={styles.statText}>{gameState.kills} Kills</span>
          </div>
          <button
            style={styles.statsCardBtn}
            onClick={() => setShowStatsCard((prev) => !prev)}
            title="Natijalar Kartasi (TAB / T)"
          >
            📊 NATIJALAR KARTASI
          </button>
          <button style={styles.pauseHudBtn} onClick={togglePause} title="Pausa (P / ESC)">
            ⏸️
          </button>
        </div>

        {/* Live On-Screen Mini-Map / Radar HUD Widget */}
        <div style={styles.hudMiniMapWidget}>
          <div style={styles.hudMiniMapHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>📍</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: zone.color || '#38bdf8', letterSpacing: '0.5px' }}>
                RADAR KARTA (M)
              </span>
            </div>
            <button
              style={styles.hudMiniMapToggleBtn}
              onClick={() => setShowHudMiniMap((prev) => !prev)}
              title={showHudMiniMap ? "Yashirish (M)" : "Ko'rsatish (M)"}
            >
              {showHudMiniMap ? '➖' : '➕'}
            </button>
          </div>

          {showHudMiniMap && (
            <div style={styles.hudRadarCircle}>
              <div style={styles.radarSweep} />
              <div style={styles.radarCenterPlayer} title="Qahramon (Siz)">
                {character.icon}
              </div>
              <div style={{ position: 'absolute', width: '65%', height: '65%', border: '1px dashed rgba(56, 189, 248, 0.4)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '35%', height: '35%', border: '1px dashed rgba(56, 189, 248, 0.6)', borderRadius: '50%' }} />

              {/* Live Enemy & Boss Dots */}
              {(gameState.enemyDots || []).map((dot, idx) => {
                const playerX = gameState.playerPos?.x || 1300;
                const playerY = gameState.playerPos?.y || 1000;
                const dx = Math.max(6, Math.min(94, 50 + ((dot.x - playerX) / 800) * 42));
                const dy = Math.max(6, Math.min(94, 50 + ((dot.y - playerY) / 800) * 42));
                const dotSize = dot.isBoss ? '13px' : '6.5px';

                return (
                  <span
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: `${dy}%`,
                      left: `${dx}%`,
                      width: dotSize,
                      height: dotSize,
                      backgroundColor: dot.color || '#ef4444',
                      borderRadius: '50%',
                      boxShadow: `0 0 8px ${dot.color || '#ef4444'}`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: dot.isBoss ? 5 : 2,
                    }}
                    title={dot.isBoss ? '⚠️ MALAKOR BOSS' : 'Zombi'}
                  />
                );
              })}

              <span style={styles.radarLabelTop}>N</span>
              <span style={styles.radarLabelBottom}>S</span>
              <span style={styles.radarLabelLeft}>W</span>
              <span style={styles.radarLabelRight}>E</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Center: Abilities Bar */}
      <div style={styles.bottomCenterHud}>
        <div style={styles.abilityBar}>
          <div style={styles.abilitySlot}>
            <div style={styles.abilityKey}>SPACE</div>
            <div style={styles.abilityName}>Dash</div>
            {gameState.dashCooldown > 0 && (
              <div style={styles.cooldownOverlay}>
                {gameState.dashCooldown.toFixed(1)}s
              </div>
            )}
          </div>

          <div style={styles.abilitySlot}>
            <div style={styles.abilityKey}>E / RMB</div>
            <div style={styles.abilityName}>Nova Slash</div>
            {gameState.specialCooldown > 0 && (
              <div style={styles.cooldownOverlay}>
                {gameState.specialCooldown.toFixed(1)}s
              </div>
            )}
          </div>

          <div style={styles.controlsInfo}>
            <span>WASD: Move</span>
            <span>•</span>
            <span>LMB: Attack</span>
            <span>•</span>
            <span>TAB / T: Natijalar Kartasi</span>
            <span>•</span>
            <span>P / ESC: Pause</span>
          </div>
        </div>
      </div>

      {/* Wave Announcement Banner */}
      {waveBanner && (
        <div style={styles.waveBannerContainer}>
          <div style={styles.waveBannerContent}>
            <h2 style={styles.waveBannerTitle}>
              {waveBanner.bannerText
                ? waveBanner.bannerText
                : waveBanner.isBossWave
                ? `⚠️ WAVE ${waveBanner.wave}: MALAKOR BOSS BATTLE ⚠️`
                : `⚔️ WAVE ${waveBanner.wave} ⚔️`}
            </h2>
            {waveBanner.unlockedTypes && (
              <p style={styles.waveBannerSub}>
                Zombilar: {waveBanner.unlockedTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Large Controls & Guide Modal on Game Entry */}
      {showControlsModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.controlsEntryModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '24px', fontWeight: '900', letterSpacing: '0.5px' }}>
                  ⌨️ BOSHQARUV TUGMALARI
                </h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  O'yinga kirishingiz bilan har bir tugma nima qilishini ko'ring!
                </span>
              </div>
              <button
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
                onClick={() => setShowControlsModal(false)}
                title="Yopish (X)"
              >
                ✕
              </button>
            </div>

            {/* Selected Zone & Hero Info Banner */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '12px 18px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                📍 <strong>Tanlangan Zona:</strong> <span style={{ color: zone.color || '#38bdf8', fontWeight: 'bold' }}>{zone.icon || '🏙️'} {zone.name}</span>
              </span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                🛡️ <strong>Qahramon:</strong> <span style={{ color: character.color, fontWeight: 'bold' }}>{character.icon} {character.name}</span>
              </span>
            </div>

            {/* Controls Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>🕹️ WASD</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Yurish / Harakat</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Qahramonni har yo'nalishga boshqarish</span>
                </div>
              </div>

              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>🎯 LMB (Chaq)</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Otish & Hujum</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Qurol / qilich bilan zarba berish</span>
                </div>
              </div>

              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>⚡ SPACEBAR</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Chaqqon Dash</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Zombilardan qochish sakrashi</span>
                </div>
              </div>

              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>💥 E / RMB (O'ng)</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Super Nova Hujum</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Atrofdagi zombilarni portlatish</span>
                </div>
              </div>

              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>📊 TAB / T</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Natijalar Kartasi</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Jonli statistikalar va Radar xaritasi</span>
                </div>
              </div>

              <div style={styles.controlBoxItem}>
                <div style={styles.controlKeyBadge}>⏸️ P / ESC</div>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block', fontSize: '14px' }}>Pausa Menyusi</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>O'yinni to'xtatib turish</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              style={styles.closeControlsBtn}
              onClick={() => setShowControlsModal(false)}
            >
              ✖ (X) TAYYORMAN! O'YINNI BOSHLASH ▶️
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && !isGameOver && !showStatsCard && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h1 style={{ color: '#38bdf8', margin: '0 0 8px 0', fontSize: '28px' }}>PAUSA</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
              O‘yin vaqtincha to‘xtatildi. Tayyor bo‘lganda davom eting.
            </p>

            <div style={styles.pauseMenuButtons}>
              <button style={styles.resumeBtn} onClick={togglePause}>
                ▶️ O‘YINNI DAVOM ETTIRISH
              </button>
              <button style={styles.soundBtn} onClick={handleToggleSound}>
                {isMuted ? '🔇 OVOZNI YOQISH' : '🔊 OVOZNI O‘CHIRISH'}
              </button>
              <button style={{ ...styles.soundBtn, border: '1px solid #38bdf8', color: '#38bdf8' }} onClick={() => setShowStatsCard(true)}>
                📊 NATIJALAR KARTASINI KO'RISH
              </button>
              <button style={styles.homeBtn} onClick={onReturnToDashboard}>
                🏠 DASHBOARDGA QAYTISH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Natijalar Kartasi Modal */}
      {showStatsCard && (
        <div style={styles.modalBackdrop}>
          <div style={styles.statsCardModal}>
            <div style={styles.statsCardHeader}>
              <div>
                <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '22px', fontWeight: '800' }}>
                  📊 O'YIN NATIJALARI KARTASI
                </h2>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Natijalar va jonli xarita nazorati</span>
              </div>
              {(() => {
                const rankInfo = getRankInfo(gameState.kills, gameState.wave, gameState.gold);
                return (
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      backgroundColor: rankInfo.bg,
                      border: `1px solid ${rankInfo.border}`,
                      color: rankInfo.color,
                      fontWeight: '900',
                      fontSize: '15px',
                      letterSpacing: '1px',
                    }}
                  >
                    {rankInfo.rank}
                  </div>
                );
              })()}
            </div>

            <div style={styles.cardContentGrid}>
              {/* Left Column: Stats */}
              <div style={styles.statsBox}>
                <div style={styles.statCardRow}>
                  <span>⏱️ Tirik Qolingan Vaqt:</span>
                  <strong style={{ color: '#38bdf8', fontSize: '15px' }}>{formatTime(gameState.timeElapsed)}</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>⚔️ Yetilgan Wave:</span>
                  <strong style={{ color: '#eab308' }}>Wave {gameState.wave}</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>💀 O'ldirilgan Zombilar:</span>
                  <strong style={{ color: '#f87171' }}>{gameState.kills} ta</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>💰 Yig'ilgan Oltin:</span>
                  <strong style={{ color: '#facc15' }}>{gameState.gold}g</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>🛡️ Qahramon:</span>
                  <strong style={{ color: character.color }}>{character.icon} {character.name} (Lv.{gameState.level})</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>🎯 Qiyinlik Darajasi:</span>
                  <strong style={{ color: difficulty.color }}>{difficulty.icon} {difficulty.name}</strong>
                </div>
                <div style={styles.statCardRow}>
                  <span>🧟 Maydondagi Zombilar:</span>
                  <strong style={{ color: '#a7f3d0' }}>{gameState.enemiesAlive} ta active</strong>
                </div>

                <div style={styles.scoreHighlightBox}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Joriy Reyting Balli:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginTop: '2px' }}>
                    🏆 {((gameState.kills * 25) + (gameState.wave * 350) + (gameState.gold * 2)).toLocaleString()} pts
                  </span>
                </div>
              </div>

              {/* Right Column: Mini-map / Radar Visualizer */}
              <div style={styles.mapRadarBox}>
                <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '12px', textAlign: 'center', letterSpacing: '1px' }}>
                  📍 RADAR XARITASI (LIVE MAP)
                </h4>
                <div style={styles.radarCircle}>
                  <div style={styles.radarSweep} />
                  <div style={styles.radarCenterPlayer} title="Qahramon (Siz)">
                    {character.icon}
                  </div>
                  <div style={{ position: 'absolute', width: '65%', height: '65%', border: '1px dashed rgba(56, 189, 248, 0.4)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', width: '35%', height: '35%', border: '1px dashed rgba(56, 189, 248, 0.6)', borderRadius: '50%' }} />
                  
                  {/* Live Dynamic Radar Dots */}
                  {(gameState.enemyDots || []).map((dot, idx) => {
                    const playerX = gameState.playerPos?.x || 1300;
                    const playerY = gameState.playerPos?.y || 1000;
                    const dx = Math.max(5, Math.min(95, 50 + ((dot.x - playerX) / 800) * 40));
                    const dy = Math.max(5, Math.min(95, 50 + ((dot.y - playerY) / 800) * 40));
                    const dotSize = dot.isBoss ? '14px' : '7px';

                    return (
                      <span
                        key={idx}
                        style={{
                          position: 'absolute',
                          top: `${dy}%`,
                          left: `${dx}%`,
                          width: dotSize,
                          height: dotSize,
                          backgroundColor: dot.color || '#ef4444',
                          borderRadius: '50%',
                          boxShadow: `0 0 8px ${dot.color || '#ef4444'}`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: dot.isBoss ? 4 : 2,
                        }}
                        title={dot.isBoss ? '⚠️ MALAKOR BOSS' : 'Dushman'}
                      />
                    );
                  })}

                  <span style={styles.radarLabelTop}>SHIMOL</span>
                  <span style={styles.radarLabelBottom}>JANUB</span>
                  <span style={styles.radarLabelLeft}>GARB</span>
                  <span style={styles.radarLabelRight}>SHARQ</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={styles.cardActionsRow}>
              <button
                style={styles.copyCardBtn}
                onClick={() => {
                  const score = (gameState.kills * 25) + (gameState.wave * 350) + (gameState.gold * 2);
                  const rank = getRankInfo(gameState.kills, gameState.wave, gameState.gold).rank;
                  const text = `🎮 PRO MAX ZOMBIE - O'YIN NATIJASI KARTASI:\n👤 O'yinchi: ${user.name}\n🛡️ Qahramon: ${character.name}\n⭐ Daraja: ${rank}\n⚔️ Wave: ${gameState.wave}\n💀 Kills: ${gameState.kills}\n💰 Oltin: ${gameState.gold}\n⏱️ Vaqt: ${formatTime(gameState.timeElapsed)}\n🏆 Ball: ${score} pts`;
                  navigator.clipboard.writeText(text);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 2500);
                }}
              >
                {copiedNotice ? '✅ NUSXALANDI!' : '📋 NATIJALARNI NUSXALASH'}
              </button>
              <button style={styles.closeCardBtn} onClick={() => setShowStatsCard(false)}>
                ❌ YOPISH (TAB)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && gameOverStats && (
        <div style={styles.modalBackdrop}>
          <div style={styles.gameOverCard}>
            <h1 style={styles.gameOverTitle}>YOU DIED</h1>
            <p style={styles.gameOverSubtitle}>Zombilar to‘dasi sizni mahv etdi!</p>

            <div style={styles.statsSummary}>
              <div style={styles.summaryRow}>
                <span>Qahramon:</span>
                <strong style={{ color: character.color }}>{character.icon} {character.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Qiyinlik:</span>
                <strong style={{ color: difficulty.color }}>{difficulty.icon} {difficulty.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Yetilgan Wave:</span>
                <strong>Wave {gameOverStats.wave}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>O‘ldirilgan Zombilar:</span>
                <strong style={{ color: '#fca5a5' }}>💀 {gameOverStats.kills}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Yig‘ilgan Gold:</span>
                <strong style={{ color: '#facc15' }}>💰 {gameOverStats.gold}g</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Umumiy Reyting Balli:</span>
                <strong style={{ color: '#4ade80', fontSize: '16px' }}>
                  🏆 {((gameOverStats.kills * 25) + (gameOverStats.wave * 350) + (gameOverStats.gold * 2)).toLocaleString()} pts
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={styles.restartButton} onClick={handleRestart}>
                🔄 YANA O‘YNAASH
              </button>
              <button style={styles.returnBtn} onClick={onReturnToDashboard}>
                🏠 DASHBOARDGA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#090d16',
    userSelect: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  topLeftHud: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 10,
    pointerEvents: 'none',
  },
  hudCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    width: '270px',
  },
  hpRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  heroAvatarBadge: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  barContainer: {
    flex: 1,
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '3px',
  },
  barLabel: {
    color: '#ef4444',
  },
  barValue: {
    color: '#cbd5e1',
  },
  barBg: {
    width: '100%',
    height: '9px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: '4px',
    transition: 'width 0.15s ease-out',
  },
  xpRow: {
    marginTop: '4px',
  },
  xpLabel: {
    color: '#38bdf8',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: '4px',
    transition: 'width 0.15s ease-out',
  },
  bossHud: {
    position: 'absolute',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    pointerEvents: 'none',
    width: '420px',
    maxWidth: '90vw',
  },
  bossCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(220, 38, 38, 0.6)',
    borderRadius: '10px',
    padding: '10px 16px',
    boxShadow: '0 0 25px rgba(220, 38, 38, 0.4)',
  },
  bossHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  bossName: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
  bossPhaseBadge: {
    color: '#fef08a',
    backgroundColor: 'rgba(185, 28, 28, 0.6)',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  bossBarBg: {
    width: '100%',
    height: '12px',
    backgroundColor: 'rgba(69, 10, 10, 0.8)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  bossBarFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.1s ease-out',
  },
  bossHpText: {
    color: '#fca5a5',
    fontSize: '10px',
    textAlign: 'center',
    marginTop: '4px',
    fontWeight: '600',
  },
  topRightHud: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  hudMiniMapWidget: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(56, 189, 248, 0.45)',
    borderRadius: '14px',
    padding: '8px 12px',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.65)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '160px',
    transition: 'all 0.2s ease',
  },
  hudMiniMapHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '6px',
    paddingBottom: '4px',
    borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
  },
  hudMiniMapToggleBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '11px',
    padding: '2px 4px',
  },
  hudRadarCircle: {
    position: 'relative',
    width: '136px',
    height: '136px',
    borderRadius: '50%',
    backgroundColor: '#090d16',
    border: '2px solid rgba(56, 189, 248, 0.6)',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.25) inset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hudStatsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statIcon: {
    fontSize: '14px',
  },
  statText: {
    color: '#f1f5f9',
    fontWeight: '600',
    fontSize: '13px',
  },
  goldText: {
    color: '#facc15',
    fontWeight: '700',
    fontSize: '14px',
  },
  pauseHudBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  bottomCenterHud: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  abilityBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '14px',
    padding: '8px 16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
  },
  abilitySlot: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '68px',
    height: '52px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '8px',
    border: '1px solid rgba(71, 85, 105, 0.6)',
  },
  abilityKey: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#93c5fd',
  },
  abilityName: {
    fontSize: '11px',
    color: '#e2e8f0',
    marginTop: '2px',
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  controlsInfo: {
    display: 'flex',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '500',
    marginLeft: '8px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(51, 65, 85, 0.6)',
  },
  waveBannerContainer: {
    position: 'absolute',
    top: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    pointerEvents: 'none',
  },
  waveBannerContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(10px)',
    border: '2px solid #38bdf8',
    borderRadius: '12px',
    padding: '16px 32px',
    textAlign: 'center',
    boxShadow: '0 0 35px rgba(56, 189, 248, 0.4)',
  },
  waveBannerTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#ffffff',
    letterSpacing: '1px',
    fontWeight: '800',
  },
  waveBannerSub: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 8, 18, 0.88)',
    backdropFilter: 'blur(8px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #38bdf8',
    borderRadius: '16px',
    padding: '32px 40px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(56, 189, 248, 0.3)',
    maxWidth: '380px',
    width: '90%',
  },
  pauseMenuButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resumeBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  soundBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  homeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  gameOverCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #ef4444',
    borderRadius: '16px',
    padding: '32px 40px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)',
    maxWidth: '420px',
    width: '90%',
  },
  gameOverTitle: {
    margin: 0,
    color: '#ef4444',
    fontSize: '36px',
    fontWeight: '900',
    letterSpacing: '2px',
  },
  gameOverSubtitle: {
    margin: '8px 0 20px 0',
    color: '#94a3b8',
    fontSize: '14px',
  },
  statsSummary: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    color: '#cbd5e1',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  restartButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  returnBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  statsCardBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    border: '1px solid #38bdf8',
    color: '#38bdf8',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  statsCardModal: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '2px solid #38bdf8',
    borderRadius: '20px',
    padding: '28px 32px',
    boxShadow: '0 0 60px rgba(56, 189, 248, 0.35)',
    maxWidth: '650px',
    width: '92%',
    color: '#ffffff',
  },
  statsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(51, 65, 85, 0.8)',
  },
  cardContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '24px',
  },
  statsBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '14px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid rgba(51, 65, 85, 0.5)',
  },
  statCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  scoreHighlightBox: {
    marginTop: '8px',
    paddingTop: '10px',
    borderTop: '1px dashed rgba(148, 163, 184, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mapRadarBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
  },
  radarCircle: {
    position: 'relative',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: '#090d16',
    border: '2px solid #38bdf8',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.2) inset, 0 0 15px rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  radarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.4), transparent 60deg)',
    animation: 'spin 4s linear infinite',
  },
  radarCenterPlayer: {
    zIndex: 5,
    fontSize: '20px',
    filter: 'drop-shadow(0 0 6px #38bdf8)',
  },
  radarLabelTop: { position: 'absolute', top: '4px', fontSize: '8px', color: '#38bdf8', opacity: 0.7 },
  radarLabelBottom: { position: 'absolute', bottom: '4px', fontSize: '8px', color: '#38bdf8', opacity: 0.7 },
  radarLabelLeft: { position: 'absolute', left: '4px', fontSize: '8px', color: '#38bdf8', opacity: 0.7 },
  radarLabelRight: { position: 'absolute', right: '4px', fontSize: '8px', color: '#38bdf8', opacity: 0.7 },
  cardActionsRow: {
    display: 'flex',
    gap: '12px',
  },
  copyCardBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  closeCardBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '12px 20px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
  },
  controlsEntryModal: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    backdropFilter: 'blur(16px)',
    border: '2px solid #38bdf8',
    borderRadius: '20px',
    padding: '28px 32px',
    boxShadow: '0 0 65px rgba(56, 189, 248, 0.4)',
    maxWidth: '640px',
    width: '92%',
    color: '#ffffff',
  },
  controlBoxItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(51, 65, 85, 0.7)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  controlKeyBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    border: '1px solid #38bdf8',
    color: '#38bdf8',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  closeControlsBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '900',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
    transition: 'all 0.2s ease',
  },
};
