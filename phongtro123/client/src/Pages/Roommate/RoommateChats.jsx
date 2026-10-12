import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import {
    CloseOutlined,
    EnvironmentOutlined,
    HeartFilled,
    HomeOutlined,
    MessageOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { requestGetMessages, requestGetRoommateMatches } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import styles from './RoommateChats.module.scss';

function RoommateChats() {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [searchValue, setSearchValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { globalUsersMessage, setGlobalUsersMessage } = useStore();
    const filteredMatches = matches.filter((item) =>
        `${item.name} ${item.location || ''} ${item.bio || ''}`
            .toLocaleLowerCase('vi')
            .includes(searchValue.trim().toLocaleLowerCase('vi')),
    );

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
                            studentStatus: user.studentStatus,
                            budget: user.budget,
                            interests: user.interests || [],
                            lifestyle: user.lifestyle || [],
                            preferences: user.preferences || [],
                            description: 'Bạn đã match. Bắt đầu chat ngay thôi!',
                            icon: '◫',
                            accent: '#f4d445',
                        })),
                    );
                } else {
                    setMatches([]);
                }
            } catch (error) {
                console.error('Không thể tải danh sách match:', error);
                message.error(error?.response?.data?.message || 'Không thể tải danh sách match');
                setMatches([]);
            } finally {
                setIsLoading(false);
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
        <main className={styles.page}>
            <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.eyebrow}>HOMIEHUB <span>•</span> KẾT NỐI CỦA BẠN</div>
                <div className={styles.heroRow}>
                    <div>
                        <h1>Tin nhắn & kết nối</h1>
                        <p>Nơi những lượt thích đôi bên trở thành cuộc trò chuyện đầu tiên về mái nhà chung.</p>
                    </div>
                    <Link className={styles.editLink} to="/roommate/onboarding?edit=1">Sửa hồ sơ</Link>
                </div>
            </header>

            <div className={styles.summary}>
                <span className={styles.summaryIcon}><HeartFilled /></span>
                <div className={styles.summaryCopy}><span className={styles.summaryLabel}>KẾT NỐI CỦA BẠN</span><strong>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</strong><p>Khi cả hai cùng thích nhau, bạn có thể bắt đầu trò chuyện.</p></div>
                <span className={styles.summaryDecoration}>♡</span>
            </div>

            <section className={styles.listSection}>
                <div className={styles.listHeading}>
                    <div><h2>Danh sách match</h2><p>Những người bạn đã kết nối thành công</p></div>
                    {matches.length > 0 && (
                        <label className={styles.searchBox}>
                            <SearchOutlined />
                            <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm trong danh sách" />
                        </label>
                    )}
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}><span className={styles.spinner} /><strong>Đang tải kết nối...</strong></div>
                ) : filteredMatches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>{searchValue ? <SearchOutlined /> : <HeartFilled />}</span>
                        <h3>{searchValue ? 'Không tìm thấy kết quả' : 'Chưa có match nào'}</h3>
                        <p>{searchValue ? 'Thử tên hoặc khu vực khác nhé.' : 'Hãy tiếp tục khám phá hồ sơ cùng giới tính. Khi cả hai cùng thích nhau, match sẽ xuất hiện ở đây.'}</p>
                        {!searchValue && <Link className={styles.discoverLink} to="/roommate/discover">Khám phá hồ sơ</Link>}
                    </div>
                ) : (
                    filteredMatches.map((item) => (
                        <div
                            key={item.id}
                            className={styles.matchCard}
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
                                className={styles.matchPhoto}
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
                                    src={
                                        (Array.isArray(item.images) && item.images.find((u) => typeof u === 'string' && (u.startsWith('http') || u.startsWith('/uploads/'))))
                                        || (typeof item.avatar === 'string' && (item.avatar.startsWith('http') || item.avatar.startsWith('/uploads/')) && item.avatar)
                                        || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
                                    }
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80';
                                    }}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </button>

                            <div className={styles.matchInfo} style={{ flex: 1 }}>
                                <div className={styles.matchTitle}>
                                    <div>
                                        <h3>{item.name}</h3>
                                        <span>{item.age ? `${item.age} tuổi` : ''}{item.gender ? ` · ${item.gender}` : ''}{item.location ? ` · ${item.location}` : ''}</span>
                                    </div>
                                    <span className={styles.connectedBadge}><HeartFilled /> Đã kết nối</span>
                                </div>
                                <div className={styles.details}>
                                    {item.studentStatus && <span>{item.studentStatus}</span>}
                                    {Number(item.budget) > 0 && <span>{Number(item.budget).toLocaleString('vi-VN')} đ/tháng</span>}
                                </div>
                                <p className={styles.bio}>{item.bio || item.description}</p>
                                {!!(item.lifestyle?.length || item.interests?.length) && (
                                    <div className={styles.tags}>
                                        {[...(item.lifestyle || []), ...(item.interests || [])].slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
                                    </div>
                                )}
                                <div className={styles.cardActions}>
                                <button
                                    type="button"
                                    onClick={() => openProfilePreview(item)}
                                    className={styles.profileButton}
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
                                    <UserOutlined /> Xem hồ sơ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openChatWithMatch(item)}
                                    className={styles.chatButton}
                                >
                                    <MessageOutlined /> Nhắn tin
                                </button>
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </section>

            {selectedMatch && (
                <div
                    onClick={() => setSelectedMatch(null)}
                    className={styles.modalOverlay}
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
                        className={styles.profileModal}
                    >
                        <div className={styles.modalPhoto}>
                            <img
                                src={selectedMatch.images?.[selectedImageIndex] || selectedMatch.avatar}
                                alt={selectedMatch.name}
                                onError={(event) => {
                                    event.currentTarget.src =
                                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80';
                                }}
                            />
                            <div className={styles.photoTopline}>
                                <span><HeartFilled /> Đã kết nối</span>
                                <button type="button" onClick={() => setSelectedMatch(null)} aria-label="Đóng hồ sơ">
                                    <CloseOutlined />
                                </button>
                            </div>
                            {selectedMatch.images?.length > 1 && (
                                <div className={styles.photoCounter}>
                                    {selectedImageIndex + 1} / {selectedMatch.images.length}
                                </div>
                            )}
                            <div className={styles.photoCaption}>
                                <span className={styles.captionGender}>{selectedMatch.gender || 'Bạn cùng nhà'}</span>
                                <h2>{selectedMatch.name}</h2>
                                <p><EnvironmentOutlined /> {selectedMatch.location || 'Chưa cập nhật khu vực'}</p>
                            </div>
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
                            {selectedMatch.images?.length > 1 && (
                                <div className={styles.photoIndicators}>
                                    {selectedMatch.images.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            className={index === selectedImageIndex ? styles.activeIndicator : ''}
                                            onClick={() => setSelectedImageIndex(index)}
                                            aria-label={`Xem ảnh ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.profileDetails}>
                            <div className={styles.profileMeta}>
                                <span><UserOutlined /> {selectedMatch.age || 24} tuổi</span>
                                <span><HomeOutlined /> {selectedMatch.studentStatus || 'Đang tìm bạn ở ghép'}</span>
                                {Number(selectedMatch.budget) > 0 && (
                                    <span>{Number(selectedMatch.budget).toLocaleString('vi-VN')} đ/tháng</span>
                                )}
                            </div>

                            <section className={styles.bioSection}>
                                <h3>Đôi nét về mình</h3>
                                <p>{selectedMatch.bio || 'Đang tìm một người bạn cùng nhà phù hợp để chia sẻ không gian sống thoải mái.'}</p>
                            </section>

                            {!!selectedMatch.lifestyle?.length && (
                                <section className={styles.tagSection}>
                                    <h3>Nếp sống</h3>
                                    <div className={styles.profileTags}>
                                        {selectedMatch.lifestyle.map((tag) => <span key={`life-${tag}`}>{tag}</span>)}
                                    </div>
                                </section>
                            )}

                            {!!selectedMatch.interests?.length && (
                                <section className={styles.tagSection}>
                                    <h3>Sở thích</h3>
                                    <div className={styles.profileTags}>
                                        {selectedMatch.interests.map((tag) => <span key={`interest-${tag}`}>{tag}</span>)}
                                    </div>
                                </section>
                            )}

                            {!!selectedMatch.preferences?.length && (
                                <section className={styles.tagSection}>
                                    <h3>Mong muốn về bạn cùng nhà</h3>
                                    <div className={styles.profileTags}>
                                        {selectedMatch.preferences.map((tag) => <span key={`preference-${tag}`}>{tag}</span>)}
                                    </div>
                                </section>
                            )}

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.modalChatButton}
                                    onClick={() => {
                                        setSelectedMatch(null);
                                        openChatWithMatch(selectedMatch);
                                    }}
                                >
                                    <MessageOutlined /> Bắt đầu trò chuyện
                                </button>
                                <button
                                    type="button"
                                    className={styles.modalCloseButton}
                                    onClick={() => setSelectedMatch(null)}
                                >
                                    Đóng hồ sơ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </main>
    );
}

export default RoommateChats;
