import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters.js';
import { DIFFICULTIES } from '../data/difficulties.js';
import { MONSTERS } from '../data/monsters.js';
import { ZONES } from '../data/zones.js';
import { getLeaderboardData } from '../data/leaderboardData.js';
import { OnlineLobbyModal } from './OnlineLobbyModal.jsx';

export const Dashboard = ({ user, onStartGame, onLogout }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTIES[1]);
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);
  const [gameMode, setGameMode] = useState('solo'); // solo | online
  const [activeTab, setActiveTab] = useState('lobby'); // lobby | characters | monsters | leaderboard | controls
  const [leaderboardTab, setLeaderboardTab] = useState('global'); // global | national
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  const leaderboardList = getLeaderboardData();

  const filteredLeaderboard = leaderboardList.filter((item) => {
    if (leaderboardTab === 'national') {
      return item.country === (user.country || '🇺🇿');
    }
    return true;
  });

  const handleStartRun = () => {
    if (gameMode === 'online') {
      setShowOnlineModal(true);
    } else {
      onStartGame({
        character: selectedCharacter,
        difficulty: selectedDifficulty,
        zone: selectedZone,
        mode: 'solo',
      });
    }
  };

  const handleOnlineGameStart = (onlineConfig) => {
    setShowOnlineModal(false);
    onStartGame({
      character: selectedCharacter,
      difficulty: selectedDifficulty,
      zone: selectedZone,
      mode: 'online',
      roomName: onlineConfig.room,
    });
  };

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.navLogoIcon}>🧟‍♂️</span>
          <span style={styles.navTitle}>PRO MAX ZOMBIE SURVIVAL</span>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.navTabs}>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'lobby' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('lobby')}
          >
            🎮 O‘YIN MAYDONI
          </button>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'characters' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('characters')}
          >
            🛡️ PERSONAJLAR
          </button>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'monsters' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('monsters')}
          >
            🧟 ZOMBILAR CODEX
          </button>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'leaderboard' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 REYTING (TOP 10)
          </button>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'history' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('history')}
          >
            📊 O‘YIN NATIJALARI
          </button>
          <button
            style={{ ...styles.navTabBtn, color: activeTab === 'controls' ? '#38bdf8' : '#94a3b8' }}
            onClick={() => setActiveTab('controls')}
          >
            ⌨️ TUGMALAR
          </button>
        </div>

        {/* User Profile Capsule */}
        <div style={styles.userCapsule}>
          <span style={styles.userAvatar}>{user.avatar || '⚔️'}</span>
          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {user.country || '🇺🇿'} {user.name}
            </span>
            <span style={styles.userCoins}>💰 {user.coins || 150} Tangalar</span>
          </div>
          <button style={styles.logoutBtn} onClick={onLogout} title="Chiqish">
            🚪
          </button>
        </div>
      </header>

      {/* MAIN BODY BASED ON TAB */}
      <main style={styles.mainContent}>
        {/* TAB 1: LOBBY & GAME SETUP */}
        {activeTab === 'lobby' && (
          <div style={styles.lobbyGrid}>
            {/* Left Column: Character Quick Select */}
            <div style={styles.panelCard}>
              <h2 style={styles.sectionTitle}>1. PERSONAJNI TANLANG</h2>
              <div style={styles.charSelectGrid}>
                {CHARACTERS.map((hero) => {
                  const isSelected = selectedCharacter.id === hero.id;
                  return (
                    <div
                      key={hero.id}
                      onClick={() => setSelectedCharacter(hero)}
                      style={{
                        ...styles.heroCardSelect,
                        borderColor: isSelected ? hero.color : 'rgba(51, 65, 85, 0.6)',
                        backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                        boxShadow: isSelected ? `0 0 20px ${hero.color}66` : 'none',
                      }}
                    >
                      <div style={{ ...styles.heroIconBadge, background: hero.avatarBg }}>
                        {hero.icon}
                      </div>
                      <div style={styles.heroSelectInfo}>
                        <h3 style={{ margin: 0, fontSize: '15px', color: hero.color }}>{hero.name}</h3>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{hero.title}</span>
                      </div>
                      {isSelected && <span style={{ color: hero.color, fontWeight: 'bold' }}>✓</span>}
                    </div>
                  );
                })}
              </div>

              <div style={styles.selectedHeroDetails}>
                <h4 style={{ color: selectedCharacter.color, margin: '0 0 6px 0' }}>
                  {selectedCharacter.icon} {selectedCharacter.name} xususiyatlari:
                </h4>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>
                  {selectedCharacter.description}
                </p>
                <div style={styles.miniStatsRow}>
                  <span>❤️ HP: {selectedCharacter.stats.hp}</span>
                  <span>⚡ Tezlik: {selectedCharacter.stats.speed}</span>
                  <span>⚔️ Damage: {selectedCharacter.stats.damage}</span>
                  <span>🎯 Crit: {selectedCharacter.stats.critChance}%</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Mode & Difficulty */}
            <div style={styles.panelCard}>
              <h2 style={styles.sectionTitle}>2. O‘YIN REJIMI & QIYINLIK</h2>

              {/* Mode Select */}
              <div style={styles.modeToggleGroup}>
                <button
                  style={{
                    ...styles.modeBtn,
                    backgroundColor: gameMode === 'solo' ? '#2563eb' : '#1e293b',
                    borderColor: gameMode === 'solo' ? '#60a5fa' : '#334155',
                  }}
                  onClick={() => setGameMode('solo')}
                >
                  <span style={{ fontSize: '20px' }}>🗡️</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Yakkaxon (Solo)</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Jonli omon qolish rejimi</div>
                  </div>
                </button>

                <button
                  style={{
                    ...styles.modeBtn,
                    backgroundColor: gameMode === 'online' ? '#9333ea' : '#1e293b',
                    borderColor: gameMode === 'online' ? '#c084fc' : '#334155',
                  }}
                  onClick={() => setGameMode('online')}
                >
                  <span style={{ fontSize: '20px' }}>🌐</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Online Co-Op</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Ko‘p o‘yinchili lobby</div>
                  </div>
                </button>
              </div>

              {/* Difficulty Selection */}
              <h3 style={{ fontSize: '14px', color: '#94a3b8', marginTop: '16px', marginBottom: '10px' }}>
                O‘YIN QIYINLIGINI TANLANG:
              </h3>
              <div style={styles.diffGrid}>
                {DIFFICULTIES.map((diff) => {
                  const isSel = selectedDifficulty.id === diff.id;
                  return (
                    <div
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff)}
                      style={{
                        ...styles.diffCard,
                        borderColor: isSel ? diff.color : 'rgba(51, 65, 85, 0.6)',
                        backgroundColor: isSel ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                        boxShadow: isSel ? `0 0 16px ${diff.color}55` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{diff.icon}</span>
                        <strong style={{ color: diff.color }}>{diff.name}</strong>
                      </div>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{diff.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Zone / Map Selection (5 Zones) */}
              <h3 style={{ fontSize: '14px', color: '#94a3b8', marginTop: '16px', marginBottom: '10px' }}>
                📍 XARITA / ZONANI TANLANG (5 TA ZONA):
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {ZONES.map((zn) => {
                  const isSel = selectedZone.id === zn.id;
                  return (
                    <div
                      key={zn.id}
                      onClick={() => setSelectedZone(zn)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isSel ? zn.color : 'rgba(51, 65, 85, 0.6)'}`,
                        backgroundColor: isSel ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                        boxShadow: isSel ? `0 0 16px ${zn.color}55` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{zn.icon}</span>
                        <div>
                          <strong style={{ color: zn.color, fontSize: '13px', display: 'block' }}>{zn.name}</strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{zn.description}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(51,65,85,0.6)', color: zn.color, fontWeight: 'bold' }}>
                          {zn.dangerLevel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* START GAME ACTION BUTTON */}
              <button style={styles.launchGameBtn} onClick={handleStartRun}>
                {gameMode === 'online' ? '🌐 ONLINE XONALARGA KIRISH' : '🔥 O‘YINGA KIRISH (START)'}
              </button>
            </div>

            {/* Right Column: Controls Quick Reminder */}
            <div style={styles.panelCard}>
              <h2 style={styles.sectionTitle}>3. QAYS I TUGMA NIMA QILADI?</h2>
              <div style={styles.controlsList}>
                <div style={styles.controlRow}>
                  <div style={styles.keyBadge}>WASD / Yo‘nalishlar</div>
                  <span style={styles.keyDesc}>Personajni harakatlantirish</span>
                </div>
                <div style={styles.controlRow}>
                  <div style={styles.keyBadge}>Sichqoncha / Auto-Aim</div>
                  <span style={styles.keyDesc}>Nishon olish & Otish (LMB)</span>
                </div>
                <div style={styles.controlRow}>
                  <div style={styles.keyBadge}>SPACEBAR / SHIFT</div>
                  <span style={styles.keyDesc}>Tezkor Dash (Sakrash)</span>
                </div>
                <div style={styles.controlRow}>
                  <div style={styles.keyBadge}>E / Sichqoncha O‘ng</div>
                  <span style={styles.keyDesc}>Maxsus Super Hujum (AoE)</span>
                </div>
                <div style={styles.controlRow}>
                  <div style={styles.keyBadge}>P / ESC</div>
                  <span style={styles.keyDesc}>Pausa & O‘yin menyusi</span>
                </div>
              </div>

              <div style={styles.bannerNotice}>
                💡 <strong>Maslahat:</strong> Har bir to‘lqin oxirida <strong>Malakor Boss</strong> keladi!
                XP to‘plab salomatlik va qurolingizni kuchaytiring.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHARACTERS SHOWCASE */}
        {activeTab === 'characters' && (
          <div style={styles.sectionContainer}>
            <h2 style={styles.pageTitle}>🛡️ QAHRAMONLAR VA UNING QOBILIYATLARI</h2>
            <div style={styles.charFullGrid}>
              {CHARACTERS.map((char) => (
                <div key={char.id} style={{ ...styles.charFullCard, borderColor: char.color }}>
                  <div style={{ ...styles.charAvatarHeader, background: char.avatarBg }}>
                    <span style={{ fontSize: '42px' }}>{char.icon}</span>
                    <h3 style={{ margin: 0, color: '#ffffff' }}>{char.name}</h3>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{char.title}</span>
                  </div>
                  <div style={styles.charBody}>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>{char.description}</p>
                    <div style={styles.statsBarGroup}>
                      <div style={styles.statBarItem}>
                        <span>❤️ HP ({char.stats.hp})</span>
                        <div style={styles.statTrack}>
                          <div style={{ ...styles.statFill, width: `${(char.stats.hp / 150) * 100}%`, background: '#ef4444' }} />
                        </div>
                      </div>
                      <div style={styles.statBarItem}>
                        <span>⚡ Tezlik ({char.stats.speed})</span>
                        <div style={styles.statTrack}>
                          <div style={{ ...styles.statFill, width: `${(char.stats.speed / 300) * 100}%`, background: '#38bdf8' }} />
                        </div>
                      </div>
                      <div style={styles.statBarItem}>
                        <span>⚔️ Ziyon ({char.stats.damage})</span>
                        <div style={styles.statTrack}>
                          <div style={{ ...styles.statFill, width: `${(char.stats.damage / 60) * 100}%`, background: '#f59e0b' }} />
                        </div>
                      </div>
                    </div>

                    <div style={styles.skillBox}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: char.color }}>
                        ✨ Maxsus Qobiliyat: {char.specialName}
                      </span>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{char.specialDesc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MONSTERS CODEX */}
        {activeTab === 'monsters' && (
          <div style={styles.sectionContainer}>
            <h2 style={styles.pageTitle}>🧟 ZOMBILAR VA BOSHLIQLAR ALMANAXI</h2>
            <div style={styles.monsterGrid}>
              {MONSTERS.map((mon) => (
                <div key={mon.id} style={{ ...styles.monsterCard, borderColor: mon.color }}>
                  <div style={styles.monsterHeader}>
                    <span style={{ fontSize: '36px' }}>{mon.icon}</span>
                    <div>
                      <h3 style={{ margin: 0, color: mon.color }}>{mon.name}</h3>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{mon.type}</span>
                    </div>
                  </div>
                  <div style={styles.monsterDetails}>
                    <p style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '10px' }}>{mon.desc}</p>
                    <div style={styles.monsterStatsRow}>
                      <span>❤️ HP: {mon.hp}</span>
                      <span>💥 Damage: {mon.damage}</span>
                      <span>🌊 Wave: {mon.wave}+</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                      <strong>Xulq-atvori:</strong> {mon.behavior}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div style={styles.sectionContainer}>
            <div style={styles.leaderboardHeader}>
              <h2 style={styles.pageTitle}>🏆 ENG KO‘P KILL VA BALL YIG‘GAN JANGCHILAR</h2>
              <div style={styles.subToggle}>
                <button
                  style={{
                    ...styles.subToggleBtn,
                    backgroundColor: leaderboardTab === 'global' ? '#2563eb' : 'transparent',
                  }}
                  onClick={() => setLeaderboardTab('global')}
                >
                  🌍 Dunyo Bo‘ylab (Global)
                </button>
                <button
                  style={{
                    ...styles.subToggleBtn,
                    backgroundColor: leaderboardTab === 'national' ? '#2563eb' : 'transparent',
                  }}
                  onClick={() => setLeaderboardTab('national')}
                >
                  🇺🇿 O‘zbekiston (Milliy)
                </button>
              </div>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>O‘rin</th>
                    <th style={styles.th}>Jangchi (Player)</th>
                    <th style={styles.th}>Davlat</th>
                    <th style={styles.th}>Personaj</th>
                    <th style={styles.th}>Kills</th>
                    <th style={styles.th}>Wave</th>
                    <th style={styles.th}>Umumiy Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((item, idx) => (
                    <tr key={item.id || idx} style={styles.tableBodyRow}>
                      <td style={styles.tdRank}>
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>
                      <td style={styles.tdUser}>
                        <span>{item.avatar || '⚔️'}</span>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={styles.td}>{item.country} {item.countryName}</td>
                      <td style={styles.td}>{item.character}</td>
                      <td style={styles.tdKills}>💀 {item.kills}</td>
                      <td style={styles.tdWave}>⚔️ Wave {item.wave}</td>
                      <td style={styles.tdScore}>{item.score.toLocaleString()} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MATCH HISTORY CARDS */}
        {activeTab === 'history' && (
          <div style={styles.sectionContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={styles.pageTitle}>📊 SAQLANGAN O'YIN NATIJALARI KARTALARI</h2>
              <button
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                onClick={() => {
                  localStorage.removeItem('zombie_game_history');
                  window.location.reload();
                }}
              >
                🗑️ Tarixni tozalash
              </button>
            </div>

            {(() => {
              let history = [];
              try {
                history = JSON.parse(localStorage.getItem('zombie_game_history') || '[]');
              } catch (e) {}

              if (history.length === 0) {
                return (
                  <div style={{ ...styles.panelCard, textAlign: 'center', padding: '40px' }}>
                    <h3 style={{ color: '#38bdf8', fontSize: '18px', margin: '0 0 10px 0' }}>
                      Hozircha saqlangan natijalar kartalari yo'q
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                      O'yin o'ynaganingizdan so'ng barcha natijalaringiz va statistikangiz bu yerda alohida kartalar shaklida saqlanib boradi!
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
                  {history.map((card) => (
                    <div
                      key={card.id}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: card.characterColor || '#38bdf8', fontSize: '16px' }}>
                            {card.characterIcon || '⚔️'} {card.characterName}
                          </strong>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{card.date}</div>
                        </div>
                        <div
                          style={{
                            padding: '4px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(56, 189, 248, 0.2)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            fontWeight: '900',
                            fontSize: '13px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {card.rank || 'RANK'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>⏱️ Tirik qolgan vaqt:</span>
                          <strong style={{ color: '#38bdf8' }}>{Math.floor((card.timeElapsed || 0) / 60)}m {(card.timeElapsed || 0) % 60}s</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>⚔️ Yetilgan Wave:</span>
                          <strong style={{ color: '#eab308' }}>Wave {card.wave}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>💀 O'ldirilgan Zombilar:</span>
                          <strong style={{ color: '#f87171' }}>{card.kills} ta</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>💰 Yig'ilgan Oltin:</span>
                          <strong style={{ color: '#facc15' }}>{card.gold}g</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', paddingTop: '4px', borderTop: '1px dashed rgba(148, 163, 184, 0.2)' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Reyting Balli: </span>
                        <strong style={{ fontSize: '18px', color: '#4ade80' }}>🏆 {(card.score || 0).toLocaleString()} pts</strong>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: CONTROLS & GUIDE */}
        {activeTab === 'controls' && (
          <div style={styles.sectionContainer}>
            <h2 style={styles.pageTitle}>⌨️ TO‘LIQ BOSHQARUV TUGMALARI VA MASLAHATLAR</h2>
            <div style={styles.controlsLargeGrid}>
              <div style={styles.guideCard}>
                <h3>🎮 Keyboard & Mouse Controls</h3>
                <div style={styles.keysVisualList}>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>W</kbd> <kbd style={styles.kbd}>A</kbd> <kbd style={styles.kbd}>S</kbd>{' '}
                    <kbd style={styles.kbd}>D</kbd>
                    <span>Yuqoriga, chapga, pastga, o‘ngga yurish</span>
                  </div>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>LMB (Chaq Sichqoncha)</kbd>
                    <span>Asosiy quroldan uzluksiz otish/qilich urish</span>
                  </div>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>TAB</kbd> yoki <kbd style={styles.kbd}>T</kbd>
                    <span>Jonli Natijalar Kartasi va Radar xaritasini ko'rish</span>
                  </div>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>SPACEBAR</kbd>
                    <span>Chaqqon sakrash (Dash) va o‘q-dorilardan qochish</span>
                  </div>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>E</kbd> yoki <kbd style={styles.kbd}>RMB (O‘ng Sichqoncha)</kbd>
                    <span>Super AoE Nova portlashi</span>
                  </div>
                  <div style={styles.keyVisualItem}>
                    <kbd style={styles.kbd}>P</kbd> yoki <kbd style={styles.kbd}>ESC</kbd>
                    <span>O‘yinni pausaga qo‘yish / Menyuga chiqish</span>
                  </div>
                </div>
              </div>

              <div style={styles.guideCard}>
                <h3>🧠 G‘alaba Qozonish Sirlari</h3>
                <ul style={styles.tipsList}>
                  <li>🔹 Dushmanlar o‘rtasida qolib ketmang, doimo doira bo‘ylab harakatlaning (Kiting).</li>
                  <li>🔹 Zombilar tushirgan tanga va XP zumradlarini magnit masofangiz orqali yig‘ing.</li>
                  <li>🔹 Boss kelganda darhol uning atrofidagi dushmanlarni tozalab, keyin bossga hujum qiling.</li>
                  <li>🔹 Afsonaviy rejimda o‘ynab 2.5x ko‘proq reyting ballari va tangalar qozoning!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Online Lobby Modal */}
      {showOnlineModal && (
        <OnlineLobbyModal
          user={user}
          onClose={() => setShowOnlineModal(false)}
          onStartOnlineGame={handleOnlineGameStart}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#090d16',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navLogoIcon: {
    fontSize: '24px',
  },
  navTitle: {
    fontWeight: '900',
    fontSize: '16px',
    letterSpacing: '1px',
    background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navTabs: {
    display: 'flex',
    gap: '8px',
  },
  navTabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userCapsule: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #334155',
    padding: '6px 14px',
    borderRadius: '20px',
  },
  userAvatar: {
    fontSize: '18px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
  },
  userName: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userCoins: {
    color: '#facc15',
    fontSize: '11px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: '6px',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  lobbyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  panelCard: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '0.5px',
  },
  charSelectGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  heroCardSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  heroIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  heroSelectInfo: {
    flex: 1,
  },
  selectedHeroDetails: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '10px',
    padding: '12px',
    marginTop: 'auto',
    border: '1px solid #334155',
  },
  miniStatsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    fontSize: '11px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  modeToggleGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid',
    color: '#ffffff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  diffGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '20px',
  },
  diffCard: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '2px solid',
    cursor: 'pointer',
  },
  launchGameBtn: {
    marginTop: 'auto',
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '900',
    cursor: 'pointer',
    letterSpacing: '1px',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
    transition: 'transform 0.15s',
  },
  controlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #334155',
  },
  keyBadge: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  keyDesc: {
    fontSize: '12px',
    color: '#cbd5e1',
  },
  bannerNotice: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#cbd5e1',
    fontSize: '12px',
    padding: '12px',
    borderRadius: '10px',
    lineHeight: '1.4',
    marginTop: 'auto',
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#ffffff',
  },
  charFullGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
    gap: '20px',
  },
  charFullCard: {
    backgroundColor: '#0f172a',
    border: '2px solid',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  charAvatarHeader: {
    padding: '20px',
    textAlign: 'center',
  },
  charBody: {
    padding: '16px',
  },
  statsBarGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  statBarItem: {
    fontSize: '11px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  statTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1e293b',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '2px',
  },
  statFill: {
    height: '100%',
    borderRadius: '3px',
  },
  skillBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  monsterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  monsterCard: {
    backgroundColor: '#0f172a',
    border: '2px solid',
    borderRadius: '14px',
    padding: '16px',
  },
  monsterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  monsterDetails: {},
  monsterStatsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#f1f5f9',
    fontWeight: 'bold',
  },
  leaderboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subToggle: {
    display: 'flex',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '4px',
  },
  subToggleBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeadRow: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: '12px',
  },
  th: {
    padding: '14px 16px',
  },
  tableBodyRow: {
    borderBottom: '1px solid #1e293b',
    fontSize: '13px',
  },
  tdRank: {
    padding: '14px 16px',
    fontWeight: 'bold',
    color: '#facc15',
  },
  tdUser: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  td: {
    padding: '14px 16px',
    color: '#cbd5e1',
  },
  tdKills: {
    padding: '14px 16px',
    color: '#fca5a5',
    fontWeight: '600',
  },
  tdWave: {
    padding: '14px 16px',
    color: '#60a5fa',
    fontWeight: '600',
  },
  tdScore: {
    padding: '14px 16px',
    color: '#4ade80',
    fontWeight: 'bold',
  },
  controlsLargeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  guideCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
  },
  keysVisualList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '16px',
  },
  keyVisualItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  kbd: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '4px 8px',
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  tipsList: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingLeft: '0',
    listStyle: 'none',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
};
