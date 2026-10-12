import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestGetRoommateSuggestions, requestSwipeRoommate } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import { EditOutlined, FilterOutlined, MessageOutlined } from '@ant-design/icons';
import styles from './RoommateDiscover.module.scss';

const FALLBACK_AVATAR =
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80';

const normalizeGender = (value) => {
    if (typeof value !== 'string') return '';
    const normalized = value
        .trim()
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (['nam', 'male', 'man'].includes(normalized)) return 'Nam';
    if (['nu', 'female', 'woman'].includes(normalized)) return 'Nữ';
    if (['khac', 'other', 'non-binary', 'nonbinary'].includes(normalized)) return 'Khác';
    return '';
};

const isRenderableImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const value = url.trim();
    if (!value) return false;
    if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\') || value.startsWith('/Users/') || value.startsWith('/home/')) {
        return false;
    }
    if (value.startsWith('/uploads/')) return true;
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const resolveImageList = (profile) => {
    if (!profile) return [FALLBACK_AVATAR];
    const fromApi = Array.isArray(profile.images) ? profile.images.filter(isRenderableImageUrl) : [];
    if (fromApi.length) return fromApi;
    if (isRenderableImageUrl(profile.avatar)) return [profile.avatar];
    return [FALLBACK_AVATAR];
};

function RoommateDiscover() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dataUser, setGlobalUsersMessage } = useStore();
    const [profiles, setProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [liked, setLiked] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showGallery, setShowGallery] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [dragX, setDragX] = useState(0);
    const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
    const dragStartRef = useRef(null);
    const suppressCardClickRef = useRef(false);
    const [filters, setFilters] = useState({
        location: 'Tất cả',
        budget: 'Tất cả',
        interests: [],
        lifestyle: [],
        distance: 'Tất cả',
        preferences: [],
    });

    const buildSuggestionParams = useCallback(() => {
        const params = {};
        if (filters.location && filters.location !== 'Tất cả') params.location = filters.location;
        if (filters.budget && filters.budget !== 'Tất cả') params.budget = filters.budget;
        if (filters.lifestyle?.length) params.lifestyle = filters.lifestyle;
        if (filters.interests?.length) params.interests = filters.interests;
        if (filters.preferences?.length) params.preferences = filters.preferences;
        if (filters.distance && filters.distance !== 'Tất cả') params.distance = filters.distance;
        return params;
    }, [
        filters.location,
        filters.budget,
        filters.lifestyle,
        filters.interests,
        filters.preferences,
        filters.distance,
    ]);

    const advancedFilters = {
        locationOptions: ['Tất cả', 'Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Bắc Ninh'],
        budgetOptions: ['Tất cả', 'Dưới 3 triệu', '3-5 triệu', '5-7 triệu', '7 triệu+'],
        interestOptions: ['Yoga', 'Travel', 'Reading', 'Gym', 'Coffee', 'Make-up', 'Fashion', 'Pilates'],
        lifestyleOptions: ['Sạch sẽ', 'Yên tĩnh', 'Làm việc từ xa', 'Cuối tuần đi chơi', 'Dễ thích nghi'],
        distanceOptions: ['Tất cả', '5 km', '10 km', '20 km', '30 km', '50 km'],
        preferenceOptions: ['Không hút thuốc', 'Làm việc từ xa', 'Có pet', 'Không có pet', 'Tự do về giờ giấc'],
    };

    useEffect(() => {
        if (dataUser?._id && !dataUser?.roommateProfile?.location) {
            navigate('/roommate/onboarding', { replace: true });
        }
    }, [dataUser, navigate]);

    useEffect(() => {
        document.title = 'Discover - Ghép trọ';
        const roommateGender = normalizeGender(dataUser?.roommateProfile?.gender);
        let isActive = true;

        const fetchSuggestions = async () => {
            setIsLoading(true);
            setProfiles([]);
            setCurrentIndex(0);
            try {
                const response = await requestGetRoommateSuggestions(buildSuggestionParams());
                const matchingProfiles = (response?.metadata || []).filter((profile) => {
                    return !roommateGender || normalizeGender(profile.gender) === roommateGender;
                });
                if (isActive && matchingProfiles.length) {
                    setProfiles(matchingProfiles);
                } else {
                    if (isActive) setProfiles([]);
                }
            } catch (error) {
                if (isActive) {
                    console.error('Roommate API error', error);
                    message.error(error?.response?.data?.message || 'Không thể tải danh sách ghép trọ');
                    setProfiles([]);
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        };
        fetchSuggestions();
        return () => {
            isActive = false;
        };
    }, [
        dataUser?.roommateProfile?.gender,
        location.key,
        filters.location,
        filters.budget,
        filters.lifestyle,
        filters.interests,
        filters.preferences,
        filters.distance,
        buildSuggestionParams,
    ]);

    const currentProfile = useMemo(() => profiles[currentIndex], [profiles, currentIndex]);
    const currentImages = useMemo(() => resolveImageList(currentProfile), [currentProfile]);

    useEffect(() => {
        setImageIndex(0);
        setDragX(0);
        setIsSwipeAnimating(false);
    }, [currentProfile?._id]);

    const handleCardPointerDown = (event) => {
        if (event.button !== 0 || isSwipeAnimating || event.target.closest('button')) return;
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        suppressCardClickRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleCardPointerMove = (event) => {
        if (!dragStartRef.current || isSwipeAnimating) return;
        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
            suppressCardClickRef.current = true;
            setDragX(deltaX);
        }
    };

    const handleCardPointerUp = (event) => {
        if (!dragStartRef.current) return;
        const finalDeltaX = event.clientX - dragStartRef.current.x;
        dragStartRef.current = null;
        if (Math.abs(finalDeltaX) > 105) {
            const direction = finalDeltaX > 0 ? 'right' : 'left';
            setIsSwipeAnimating(true);
            setDragX((direction === 'right' ? 1 : -1) * Math.max(window.innerWidth, 700));
            window.setTimeout(() => handleSwipe(direction), 180);
        } else {
            setDragX(0);
        }
    };

    const handleCardPointerCancel = () => {
        dragStartRef.current = null;
        setDragX(0);
        setIsSwipeAnimating(false);
    };

    const handleCardClick = () => {
        if (suppressCardClickRef.current) {
            suppressCardClickRef.current = false;
            return;
        }
        setShowGallery(true);
    };

    if (isLoading) {
        return (
            <div className={styles.emptyState} style={{ maxWidth: 520, margin: '40px auto', padding: 24, textAlign: 'center' }}>
                <h2>Đang tải gợi ý...</h2>
            </div>
        );
    }

    if (!currentProfile) {
        return (
            <div className={styles.emptyState} style={{ maxWidth: 520, margin: '40px auto', padding: 24, textAlign: 'center' }}>
                <h2>Chưa có người ghép trọ phù hợp</h2>
                <p>
                    Hãy thử thay đổi bộ lọc hoặc quay lại sau nhé. Danh sách ghép theo mục “Giới tính ghép trọ” trong hồ sơ,
                    không dựa trên nội dung bio.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/roommate/onboarding?edit=1')}
                    style={{
                        border: 0,
                        borderRadius: 8,
                        padding: '10px 16px',
                        background: '#e94057',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    Kiểm tra giới tính hồ sơ
                </button>
            </div>
        );
    }

    const goToImage = (offset) => {
        if (!currentImages.length) return;
        setImageIndex((prev) => (prev + offset + currentImages.length) % currentImages.length);
    };

    const advanceToNextProfile = () => {
        const nextIndex = (currentIndex + 1) % profiles.length;
        setCurrentIndex(nextIndex);
        if (profiles[nextIndex]?._id === currentProfile?._id) {
            setDragX(0);
            setIsSwipeAnimating(false);
        }
    };

    const handleSwipe = async (direction) => {
        if (!currentProfile) return;
        const currentGender = normalizeGender(dataUser?.roommateProfile?.gender);
        if (
            currentGender &&
            normalizeGender(currentProfile.gender) !== currentGender
        ) {
            message.error('Hồ sơ này không cùng giới tính ghép trọ với bạn. Danh sách sẽ được tải lại.');
            setProfiles([]);
            setCurrentIndex(0);
            return;
        }

        try {
            const response = await requestSwipeRoommate({
                targetUserId: currentProfile._id,
                direction: direction === 'right' ? 'like' : 'pass',
            });

            if (response?.metadata?.matched) {
                const matchedUser = {
                    id: currentProfile._id,
                    username: currentProfile.fullName || currentProfile.name,
                    avatar: currentImages[0] || currentProfile.avatar || FALLBACK_AVATAR,
                    status: 'Đang hoạt động',
                    messages: [],
                };

                setGlobalUsersMessage((prev) => {
                    const exists = prev.some((user) => String(user.id) === String(currentProfile._id));
                    return exists ? prev : [...prev, matchedUser];
                });

                message.success({
                    content: 'Bạn vừa match! Bấm Chat ngay để nhắn tin.',
                    duration: 2,
                    onClose: () => navigate('/roommate/chats'),
                });
                advanceToNextProfile();
                return;
            }

            message.info(
                `Bạn đã ${direction === 'right' ? 'thích' : 'bỏ qua'} ${currentProfile.fullName || currentProfile.name}`,
            );
        } catch (error) {
            message.error(error?.response?.data?.message || 'Swipe thất bại');
            setDragX(0);
            setIsSwipeAnimating(false);
            return;
        }

        setLiked(direction === 'right');
        advanceToNextProfile();
    };

    const toggleFilterValue = (key, value) => {
        setFilters((prev) => {
            const current = prev[key] || [];
            if (Array.isArray(current)) {
                return {
                    ...prev,
                    [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
                };
            }
            return prev;
        });
    };

    const mainImageSrc = currentImages[imageIndex] || FALLBACK_AVATAR;
    const activeFilterCount =
        Number(filters.location !== 'Tất cả') +
        Number(filters.budget !== 'Tất cả') +
        filters.interests.length +
        filters.lifestyle.length +
        Number(filters.distance !== 'Tất cả') +
        filters.preferences.length;

    return (
        <div className={styles.page}>
            <div
                className={styles.legacyHeader}
                style={{
                    width: '100%',
                    background: '#f4f2f1',
                    borderBottom: '1px solid #e7e1df',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '8px 0 10px',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 1200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 18px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #4cd964, #2dbd7a)',
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: '#fff',
                                    fontWeight: 900,
                                }}
                            >
                                H
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>homehub</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                maxWidth: 470,
                                background: '#fff',
                                borderRadius: 999,
                                border: '1px solid #e4e4e4',
                                height: 46,
                                padding: '0 16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            }}
                        >
                            <span style={{ fontSize: 20, color: '#666', marginRight: 10 }}>⌕</span>
                            <input
                                value=""
                                placeholder="Tìm kiếm phòng trọ, nhà..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    flex: 1,
                                    fontSize: 16,
                                    background: 'transparent',
                                    color: '#333',
                                }}
                                readOnly
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <button
                            type="button"
                            onClick={() => setShowFilters((prev) => !prev)}
                            style={{
                                border: 'none',
                                background: '#2ec46e',
                                color: '#fff',
                                borderRadius: 999,
                                padding: '11px 18px',
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                boxShadow: '0 8px 18px rgba(46, 196, 110, 0.25)',
                            }}
                        >
                            Tìm người ghép trọ
                        </button>
                        <button
                            type="button"
                            style={{
                                border: 'none',
                                background: '#f0f0f0',
                                borderRadius: '50%',
                                width: 42,
                                height: 42,
                                cursor: 'pointer',
                                fontSize: 18,
                            }}
                        >
                            ◌
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: '#dfe3ec',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 16,
                                }}
                            >
                                👤
                            </div>
                            <div style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>Nguyễn Thế Minh</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.content} style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '18px 20px 0' }}>
                <header className={styles.hero}>
                    <div>
                        <div className={styles.eyebrow}>HOMIEHUB <span>•</span> ROOMMATE DISCOVER</div>
                        <h1>Tìm người bạn cùng nhà</h1>
                        <p>Khám phá những người phù hợp với nếp sống và kế hoạch thuê trọ của bạn.</p>
                        <div className={styles.heroBadges}>
                            <span>✓ Ghép cùng giới tính</span>
                            <span>⌖ {dataUser?.roommateProfile?.location || 'Khu vực của bạn'}</span>
                            <span>♧ {dataUser?.roommateProfile?.gender || 'Chưa chọn giới tính'}</span>
                        </div>
                    </div>
                    <div className={styles.heroActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => navigate('/roommate/onboarding?edit=1')}>
                            <EditOutlined /> Sửa hồ sơ
                        </button>
                        <button type="button" className={styles.primaryButton} onClick={() => navigate('/roommate/chats')}>
                            <MessageOutlined /> Tin nhắn
                        </button>
                    </div>
                </header>

                <div className={styles.toolbar}>
                    <div>
                        <strong>Hồ sơ phù hợp</strong>
                        <span>Kết quả được lọc theo giới tính ghép trọ trong hồ sơ của bạn.</span>
                    </div>
                    <button type="button" className={styles.filterToggle} onClick={() => setShowFilters((prev) => !prev)}>
                        <FilterOutlined /> {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
                        {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
                    </button>
                </div>
                {showFilters && (
                    <div
                        className={styles.filterPanel}
                        style={{
                            background: '#f7f7f7',
                            borderRadius: 20,
                            padding: 16,
                            marginBottom: 18,
                            border: '1px solid #ececec',
                        }}
                    >
                        <div className={styles.filterHeading}>
                            <div><h2>Bộ lọc tìm kiếm</h2><p>Thu hẹp kết quả theo thói quen và nhu cầu của bạn.</p></div>
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    className={styles.clearFilters}
                                    onClick={() => setFilters({
                                        location: 'Tất cả',
                                        budget: 'Tất cả',
                                        interests: [],
                                        lifestyle: [],
                                        distance: 'Tất cả',
                                        preferences: [],
                                    })}
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Khu vực</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.locationOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.location === item}
                                        onClick={() => setFilters((prev) => ({ ...prev, location: item }))}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.location === item ? '1px solid #111' : '1px solid #ddd',
                                            background: filters.location === item ? '#111' : '#fff',
                                            color: filters.location === item ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Khoảng giá thuê</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.budgetOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.budget === item}
                                        onClick={() => setFilters((prev) => ({ ...prev, budget: item }))}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.budget === item ? '1px solid #111' : '1px solid #ddd',
                                            background: filters.budget === item ? '#111' : '#fff',
                                            color: filters.budget === item ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Sở thích</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.interestOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.interests.includes(item)}
                                        onClick={() => toggleFilterValue('interests', item)}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.interests.includes(item) ? '1px solid #111' : '1px solid #ddd',
                                            background: filters.interests.includes(item) ? '#111' : '#fff',
                                            color: filters.interests.includes(item) ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Lifestyle</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.lifestyleOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.lifestyle.includes(item)}
                                        onClick={() => toggleFilterValue('lifestyle', item)}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.lifestyle.includes(item) ? '1px solid #111' : '1px solid #ddd',
                                            background: filters.lifestyle.includes(item) ? '#111' : '#fff',
                                            color: filters.lifestyle.includes(item) ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Khoảng cách</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.distanceOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.distance === item}
                                        onClick={() => setFilters((prev) => ({ ...prev, distance: item }))}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.distance === item ? '1px solid #111' : '1px solid #ddd',
                                            background: filters.distance === item ? '#111' : '#fff',
                                            color: filters.distance === item ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>User preferences</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {advancedFilters.preferenceOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={filters.preferences.includes(item)}
                                        onClick={() => toggleFilterValue('preferences', item)}
                                        style={{
                                            borderRadius: 999,
                                            border: filters.preferences.includes(item)
                                                ? '1px solid #111'
                                                : '1px solid #ddd',
                                            background: filters.preferences.includes(item) ? '#111' : '#fff',
                                            color: filters.preferences.includes(item) ? '#fff' : '#111',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.cardStage} style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: 18 }}>
                    <div
                        className={styles.profileCard}
                        onPointerDown={handleCardPointerDown}
                        onPointerMove={handleCardPointerMove}
                        onPointerUp={handleCardPointerUp}
                        onPointerCancel={handleCardPointerCancel}
                        style={{
                            position: 'relative',
                            width: 420,
                            height: 560,
                            borderRadius: 32,
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            background: '#eee',
                            transform: `translateX(${dragX}px) rotate(${dragX * 0.045}deg)`,
                            transition: dragStartRef.current
                                ? 'none'
                                : 'transform 220ms ease, opacity 220ms ease',
                            opacity: isSwipeAnimating ? 0 : 1,
                            cursor: dragStartRef.current ? 'grabbing' : 'grab',
                            touchAction: 'pan-y',
                        }}
                    >
                        <div
                            className={`${styles.swipeStamp} ${styles.likeStamp}`}
                            style={{ opacity: Math.min(Math.max(dragX / 90, 0), 1) }}
                        >
                            THÍCH
                        </div>
                        <div
                            className={`${styles.swipeStamp} ${styles.passStamp}`}
                            style={{ opacity: Math.min(Math.max(-dragX / 90, 0), 1) }}
                        >
                            BỎ QUA
                        </div>
                        <div
                            onClick={handleCardClick}
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                            }}
                        >
                            <img
                                src={mainImageSrc}
                                alt={currentProfile.fullName || currentProfile.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.currentTarget.src = FALLBACK_AVATAR;
                                }}
                            />

                            {currentImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToImage(-1);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 38,
                                            height: 38,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 24,
                                            lineHeight: 1,
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToImage(1);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 38,
                                            height: 38,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 24,
                                            lineHeight: 1,
                                        }}
                                    >
                                        ›
                                    </button>
                                </>
                            )}

                            {currentImages.length > 1 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: 14,
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        gap: 8,
                                    }}
                                >
                                    {currentImages.map((_, index) => (
                                        <div
                                            key={`${currentProfile._id}-${index}`}
                                            style={{
                                                width: index === imageIndex ? 12 : 8,
                                                height: index === imageIndex ? 12 : 8,
                                                borderRadius: '50%',
                                                background: index === imageIndex ? '#fff' : 'rgba(255,255,255,0.6)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                position: 'absolute',
                                left: 18,
                                right: 18,
                                bottom: 18,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ maxWidth: '72%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                                        {currentProfile.fullName || currentProfile.name}
                                    </span>
                                    <span style={{ fontSize: 30, fontWeight: 700, color: 'white' }}>
                                        {currentProfile.age || 24}
                                    </span>
                                </div>
                                <div style={{ color: 'white', fontSize: 20, marginTop: 8 }}>
                                    {currentProfile.address || currentProfile.location}
                                </div>
                                <div className={styles.profileFacts}>
                                    <span>{currentProfile.gender}</span>
                                    <span>{currentProfile.studentStatus || 'Đang tìm bạn ở ghép'}</span>
                                    {currentProfile.budget && <span>{currentProfile.budget}/tháng</span>}
                                </div>
                                <div style={{ color: '#fff', fontSize: 18, marginTop: 8, opacity: 0.95 }}>
                                    {currentProfile.bio}
                                </div>
                                {!!currentProfile.lifestyle?.length && (
                                    <div className={styles.profileTags}>
                                        {currentProfile.lifestyle.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '50%',
                                    background: '#f4d445',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 26,
                                    fontWeight: 900,
                                    color: '#111',
                                    boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                }}
                            >
                                ★
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowGallery(true);
                            }}
                            style={{
                                position: 'absolute',
                                right: 16,
                                bottom: 18,
                                border: 'none',
                                borderRadius: 999,
                                background: 'rgba(17,17,17,0.75)',
                                color: '#fff',
                                padding: '8px 12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backdropFilter: 'blur(6px)',
                                fontSize: 12,
                            }}
                        >
                            Xem thêm ảnh
                        </button>
                    </div>
                </div>

                <div className={styles.dragHint}>Kéo thẻ sang trái để bỏ qua · Kéo sang phải để thích</div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 26 }}>
                    <button
                        className={styles.passButton}
                        onClick={() => handleSwipe('left')}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            border: 'none',
                            background: '#111',
                            color: '#fff',
                            fontSize: 42,
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        }}
                        aria-label="skip"
                    >
                        ×
                    </button>

                    <button
                        className={styles.likeButton}
                        onClick={() => handleSwipe('right')}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            border: 'none',
                            background: liked ? '#dff7eb' : '#f2f2f2',
                            color: '#0a8f5c',
                            fontSize: 38,
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            display: 'grid',
                            placeItems: 'center',
                            lineHeight: 1,
                        }}
                        aria-label="match"
                    >
                        🤝
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                    <button
                        type="button"
                        onClick={() => navigate('/roommate/chats')}
                        style={{
                            border: 'none',
                            background: '#111',
                            color: '#fff',
                            borderRadius: 999,
                            padding: '12px 20px',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Chat với match
                    </button>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginTop: 24,
                        justifyContent: 'center',
                        padding: '0 20px',
                    }}
                >
                    {(currentProfile.tags || currentProfile.interests || []).slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            style={{
                                border: '1px solid #d9d9d9',
                                padding: '8px 16px',
                                borderRadius: 999,
                                background: '#f9f9f9',
                                fontSize: 16,
                                color: '#333',
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {showGallery && (
                <div
                    onClick={() => setShowGallery(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 1000,
                        padding: 18,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(520px, 100%)',
                            borderRadius: 24,
                            background: '#fff',
                            padding: 18,
                            boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 800 }}>
                                {currentProfile.fullName || currentProfile.name}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGallery(false)}
                                style={{
                                    border: 'none',
                                    background: '#f3f3f3',
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#f5f5f5' }}>
                            <img
                                src={currentImages[imageIndex] || FALLBACK_AVATAR}
                                alt="gallery"
                                style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                    e.currentTarget.src = FALLBACK_AVATAR;
                                }}
                            />
                            {currentImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => goToImage(-1)}
                                        style={{
                                            position: 'absolute',
                                            left: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: 38,
                                            height: 38,
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 24,
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToImage(1)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: 38,
                                            height: 38,
                                            background: 'rgba(255,255,255,0.9)',
                                            cursor: 'pointer',
                                            fontSize: 24,
                                        }}
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>

                        {currentImages.length > 1 && (
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 4 }}>
                                {currentImages.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        type="button"
                                        onClick={() => setImageIndex(index)}
                                        style={{
                                            border: index === imageIndex ? '2px solid #111' : '2px solid transparent',
                                            borderRadius: 12,
                                            width: 72,
                                            height: 72,
                                            padding: 0,
                                            overflow: 'hidden',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <img
                                            src={image}
                                            alt="thumbnail"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.currentTarget.src = FALLBACK_AVATAR;
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoommateDiscover;