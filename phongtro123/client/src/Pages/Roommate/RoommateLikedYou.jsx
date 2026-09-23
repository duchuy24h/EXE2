import { useEffect, useState } from 'react';
import { requestGetRoommateLikedYou } from '../../config/request';

const likedProfiles = [
    {
        id: 1,
        name: 'Aria',
        age: 22,
        bio: 'Chill vibe, không gian sạch sẽ, thích ngồi café và du lịch cuối tuần.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    },
];

function RoommateLikedYou() {
    const [profile, setProfile] = useState(likedProfiles[0]);

    useEffect(() => {
        document.title = 'Liked You';
        const fetchLikedYou = async () => {
            try {
                const response = await requestGetRoommateLikedYou();
                if (response?.metadata?.length) {
                    const firstUser = response.metadata[0];
                    setProfile({
                        id: firstUser._id,
                        name: firstUser.fullName,
                        avatar: firstUser.avatar,
                        bio: `${firstUser.address || 'Hà Nội'} · Đã thích bạn`,
                    });
                }
            } catch (error) {
                console.log('Liked You fallback active');
            }
        };

        fetchLikedYou();
    }, []);

    return (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 80px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 18, color: '#111', fontWeight: 700 }}>Liked You</div>
                <div style={{ fontSize: 28, color: '#111' }}>◌</div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
                <div
                    style={{
                        width: 148,
                        height: 148,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        margin: '0 auto 22px',
                        border: '4px solid #f2f2f2',
                        boxShadow: '0 10px 18px rgba(0,0,0,0.08)',
                    }}
                >
                    <img
                        src={profile.avatar}
                        alt={profile.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <div style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                    Be seen by up to 10x more people
                </div>

                <div style={{ marginTop: 18, fontSize: 18, lineHeight: 1.6, color: '#444' }}>
                    With Spotlights you'll be seen by more people so you get even more chances to connect.
                </div>

                <button
                    style={{
                        marginTop: 26,
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 999,
                        width: '100%',
                        height: 62,
                        fontSize: 24,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                    }}
                >
                    Try a Spotlight
                </button>
            </div>
        </div>
    );
}

export default RoommateLikedYou;
