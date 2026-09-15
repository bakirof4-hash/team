import React, { useState } from 'react';

export const OnlineLobbyModal = ({ user, onClose, onStartOnlineGame }) => {
  const [activeTab, setActiveTab] = useState('rooms'); // rooms | matchmaking | create
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { user: 'ShadowHunter_UZ', text: 'Hammaga salom! Qiyin rejimda kim o‘ynaydi?', time: '15:40' },
    { user: 'CyberDemon99', text: 'Ready for Wave 20 team battle!', time: '15:42' },
    { user: 'Toshkent_PRO', text: 'Manga 1 ta jangchi va 1 ta sehrgar kerak room #3 ga', time: '15:43' },
  ]);

  const roomsList = [
    { id: 101, title: '🔥 Malakor Boss Raid [PRO]', host: 'ShadowHunter', players: '3/4', ping: '18ms', difficulty: 'Nightmare' },
    { id: 102, title: '⚡ UZB Champions Co-Op', host: 'Alisher_UZB', players: '2/4', ping: '24ms', difficulty: 'Qiyin' },
    { id: 103, title: '🛡️ Yangilar u-n mashg‘ulot', host: 'Toshkent_PRO', players: '1/4', ping: '12ms', difficulty: 'Oson' },
    { id: 104, title: '💣 Gunner & Mage Wave Survival', host: 'CyberDemon99', players: '2/2', ping: '45ms', difficulty: 'O‘rtacha' },
  ];

  const handleStartMatchmaking = () => {
    setIsSearching(true);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setSearchTimer(count);
      if (count >= 3) {
        clearInterval(interval);
        setIsSearching(false);
        onStartOnlineGame({ mode: 'online', room: 'Matchmaking Room #8' });
      }
    }, 1000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      user: user.name,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalCard}>
        {/* Top Header */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.onlineBadge}>🌐 ONLINE LOBBY</span>
            <h2 style={styles.title}>Ko‘p O‘yinchili Xonalar va Matchmaking</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button
            style={{ ...styles.tabBtn, borderBottom: activeTab === 'rooms' ? '3px solid #38bdf8' : 'none' }}
            onClick={() => setActiveTab('rooms')}
          >
            🏠 Xonalar Ro‘yxati
          </button>
          <button
            style={{ ...styles.tabBtn, borderBottom: activeTab === 'matchmaking' ? '3px solid #38bdf8' : 'none' }}
            onClick={() => setActiveTab('matchmaking')}
          >
            ⚡ Avto-Matchmaking
          </button>
          <button
            style={{ ...styles.tabBtn, borderBottom: activeTab === 'chat' ? '3px solid #38bdf8' : 'none' }}
            onClick={() => setActiveTab('chat')}
          >
            💬 Umumiy Chat (Jonli)
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {activeTab === 'rooms' && (
            <div style={styles.roomsContainer}>
              <div style={styles.roomsHeader}>
                <span>Faol O‘yin Xonalari ({roomsList.length})</span>
                <span style={styles.pingText}>🟢 Tashkent Server (Ping: 14ms)</span>
              </div>
              <div style={styles.roomsGrid}>
                {roomsList.map((room) => (
                  <div key={room.id} style={styles.roomCard}>
                    <div style={styles.roomMainInfo}>
                      <span style={styles.roomTitle}>{room.title}</span>
                      <span style={styles.roomHost}>Host: {room.host}</span>
                    </div>
                    <div style={styles.roomMeta}>
                      <span style={styles.diffBadge}>{room.difficulty}</span>
                      <span style={styles.playersBadge}>👥 {room.players}</span>
                      <button
                        style={styles.joinBtn}
                        onClick={() => onStartOnlineGame({ mode: 'online', room: room.title })}
                      >
                        KIRISH
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matchmaking' && (
            <div style={styles.matchmakingBox}>
              <div style={styles.matchIcon}>🌐</div>
              <h3>Teng Kuchli O‘yinchilar Qidiruvi</h3>
              <p>Tizim sizning darajangiz va reytingingizga mos sheriklarni topadi.</p>

              {isSearching ? (
                <div style={styles.searchingState}>
                  <div style={styles.spinner} />
                  <span>O‘yinchilar qidirilmoqda... ({searchTimer}s)</span>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Xona tayyorlanmoqda...</p>
                </div>
              ) : (
                <button style={styles.startMatchBtn} onClick={handleStartMatchmaking}>
                  🚀 MATCHMAKINGNI BOSHLASH
                </button>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={styles.chatBox}>
              <div style={styles.chatHistory}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={styles.chatRow}>
                    <span style={styles.chatUser}>{msg.user}:</span>
                    <span style={styles.chatText}>{msg.text}</span>
                    <span style={styles.chatTime}>{msg.time}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} style={styles.chatForm}>
                <input
                  type="text"
                  placeholder="Xabar yozing..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={styles.chatInput}
                />
                <button type="submit" style={styles.chatSendBtn}>
                  YUBORISH
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 8, 18, 0.88)',
    backdropFilter: 'blur(10px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '680px',
    boxShadow: '0 0 50px rgba(56, 189, 248, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottom: '1px solid #1e293b',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  onlineBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '1px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '20px',
    cursor: 'pointer',
  },
  tabNav: {
    display: 'flex',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  tabBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  body: {
    padding: '24px',
    minHeight: '320px',
  },
  roomsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  roomsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  pingText: {
    color: '#4ade80',
  },
  roomsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  roomCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomMainInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  roomTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  roomHost: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  roomMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  diffBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    color: '#fb923c',
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  playersBadge: {
    fontSize: '12px',
    color: '#cbd5e1',
  },
  joinBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
  },
  matchmakingBox: {
    textAlign: 'center',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#ffffff',
  },
  matchIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  startMatchBtn: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '900',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
  },
  searchingState: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '4px solid rgba(56, 189, 248, 0.2)',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  chatBox: {
    display: 'flex',
    flexDirection: 'column',
    height: '280px',
  },
  chatHistory: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  chatRow: {
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
  },
  chatUser: {
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  chatText: {
    color: '#f8fafc',
    flex: 1,
  },
  chatTime: {
    fontSize: '10px',
    color: '#64748b',
  },
  chatForm: {
    display: 'flex',
    gap: '8px',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    outline: 'none',
  },
  chatSendBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0 16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
