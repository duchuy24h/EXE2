import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { requestGetMessages, requestGetRoommateMatches } from '../../config/request';
import { useStore } from '../../hooks/useStore';

function RoommateChats() {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const { globalUsersMessage, setGlobalUsersMessage } = useStore();

    const openChatWithMatch = async (matchUser) => {
        if (!matchUser?.id) return;

        const existingChat = globalUsersMessage.find((user) => String(user.id) === String(matchUser.id));
        if (existingChat) {
            message.info(`Bạn đã mở cửa sổ chat với ${matchUser.name}`);
            return;
        }

        try {
            const response = await requestGetMessages({ receiverId: matchUser.id });
            const newChatUser = {
                id: matchUser.id,
                username: matchUser.name,
                avatar: matchUser.avatar,
                status: 'Đang hoạt động',
                messages: response?.metadata || [],
            };

            setGlobalUsersMessage((prev) => [...prev, newChatUser]);
            message.success(`Đã mở cuộc trò chuyện với ${matchUser.name}`);
        } catch (error) {
            console.error('Không thể mở chat với match:', error);
            message.error('Không thể mở chat với người này');
        }
    };

    useEffect(() => {
        document.title = 'Chats';
        const fetchMatches = async () => {
            try {
                const response = await requestGetRoommateMatches();
                if (response?.metadata?.length) {
                    setMatches(
                        response.metadata.map((user) => ({
                            id: user._id,
                            name: user.name,
                            avatar: user.avatar,
                            images: Array.isArray(user.images) && user.images.length ? user.images : [user.avatar],
                            bio: user.bio,
                            age: user.age,
                            location: user.location,
                            gender: user.gender,
                            interests: user.interests || [],
                            lifestyle: user.lifestyle || [],
                            description: 'Bạn đã match. Bắt đầu chat ngay thôi!',
                            icon: '◫',
                            accent: '#f4d445',
                        })),
                    );
                } else {
                    setMatches([]);
                }
            } catch (error) {
                console.log('Match fallback active');
                setMatches([]);
            }
        };

        fetchMatches();
    }, []);

    const openProfilePreview = (matchUser) => {
        setSelectedMatch(matchUser);
        setSelectedImageIndex(0);
    };

    const nextPreviewImage = (step) => {
        if (!selectedMatch?.images?.length) return;
        setSelectedImageIndex((prev) => (prev + step + selectedMatch.images.length) % selectedMatch.images.length);
    };

    return (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 80px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>Chats</h2>
                <Link to="/roommate/onboarding?edit=1" style={{ fontSize: 18, color: '#111', textDecoration: 'none' }}>
                    Sửa hồ sơ
                </Link>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Your matches</div>
                <div
                    style={{
                        background: '#f3f3f3',
                        borderRadius: 26,
                        padding: '20px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ddd, #bbb)',
                            }}
                        />
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>Match thực tế</div>
                            <div style={{ fontSize: 16, color: '#555' }}>Mở chat ngay khi trận match đã xác nhận.</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 36 }}>›</div>
                </div>
            </div>

            <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 18 }}>Chats (Recent)</div>

                {matches.length === 0 ? (
                    <div style={{ padding: '18px 12px', color: '#666', fontSize: 17 }}>Bạn chưa có match nào. Hãy swipe để bắt đầu.</div>
                ) : (
                    matches.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 18,
                                marginBottom: 28,
                                width: '100%',
                                padding: 10,
                                borderRadius: 22,
                                background: '#f9f9f9',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => openProfilePreview(item)}
                                style={{
                                    width: 110,
                                    height: 140,
                                    border: 'none',
                                    borderRadius: 18,
                                    padding: 0,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    background: '#ddd',
                                }}
                            >
                                <img
                                    src={item.images?.[0] || item.avatar}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </button>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 23, fontWeight: 700, marginBottom: 6 }}>{item.name}</div>
                                <div style={{ fontSize: 17, color: '#555', lineHeight: 1.4 }}>{item.description}</div>
                                <button
                                    type="button"
                                    onClick={() => openProfilePreview(item)}
                                    style={{
                                        marginTop: 12,
                                        border: 'none',
                                        background: '#111',
                                        color: '#fff',
                                        borderRadius: 999,
                                        padding: '8px 12px',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Xem profile đầy đủ
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => openChatWithMatch(item)}
                                style={{
                                    border: 'none',
                                    background: '#f4d445',
                                    color: '#111',
                                    borderRadius: 999,
                                    padding: '10px 14px',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Chat
                            </button>
                        </div>
                    ))
                )}
            </div>

            {selectedMatch && (
                <div
                    onClick={() => setSelectedMatch(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'grid',
                        placeItems: 'center',
                        padding: 20,
                        zIndex: 1000,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(560px, 100%)',
                            background: '#fff',
                            borderRadius: 26,
                            overflow: 'hidden',
                            boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ position: 'relative', width: '100%', height: 420, background: '#f3f3f3' }}>
                            <img
                                src={selectedMatch.images?.[selectedImageIndex] || selectedMatch.avatar}
                                alt={selectedMatch.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {selectedMatch.images?.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => nextPreviewImage(-1)}
                                        style={{
                                            position: 'absolute',
                                            left: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 22,
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => nextPreviewImage(1)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 22,
                                        }}
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>

                        <div style={{ padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ fontSize: 30, fontWeight: 800 }}>{selectedMatch.name}</div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMatch(null)}
                                    style={{
                                        border: 'none',
                                        background: '#f3f3f3',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        fontSize: 18,
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ fontSize: 18, color: '#555', marginBottom: 10 }}>
                                {selectedMatch.age || 24} · {selectedMatch.gender || 'Khác'} · {selectedMatch.location || 'Hà Nội'}
                            </div>

                            <div style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 12, color: '#333' }}>
                                {selectedMatch.bio || 'Tôi đang tìm bạn ở ghép phù hợp với lối sống thoải mái.'}
                            </div>

                            {(selectedMatch.interests || selectedMatch.lifestyle || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {[...(selectedMatch.interests || []), ...(selectedMatch.lifestyle || [])].slice(0, 8).map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                background: '#f3f3f3',
                                                color: '#111',
                                                borderRadius: 999,
                                                padding: '8px 12px',
                                                fontSize: 13,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMatch(null);
                                        openChatWithMatch(selectedMatch);
                                    }}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: '#111',
                                        color: '#fff',
                                        borderRadius: 999,
                                        padding: '12px 18px',
                                        fontSize: 16,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Chat ngay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMatch(null)}
                                    style={{
                                        flex: 1,
                                        border: '1px solid #ddd',
                                        background: '#fff',
                                        color: '#111',
                                        borderRadius: 999,
                                        padding: '12px 18px',
                                        fontSize: 16,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoommateChats;
