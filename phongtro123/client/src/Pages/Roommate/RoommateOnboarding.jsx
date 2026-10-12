import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, InputNumber, Select, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestSaveRoommateProfile } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import styles from './RoommateOnboarding.module.scss';

const genderOptions = ['Nam', 'Nữ', 'Khác'];
const studentStatusOptions = ['Sinh viên', 'Đã tốt nghiệp', 'Đi làm', 'Khác'];
const lifestyleOptions = ['Sạch sẽ', 'Yên tĩnh', 'Làm việc từ xa', 'Cuối tuần đi chơi', 'Dễ thích nghi', 'Thích đi chơi', 'Ngủ sớm'];
const interestOptions = ['Yoga', 'Travel', 'Reading', 'Gym', 'Coffee', 'Music', 'Gaming', 'Film', 'Study', 'Cooking'];
const preferenceOptions = ['Không hút thuốc', 'Làm việc từ xa', 'Có pet', 'Không có pet', 'Tự do về giờ giấc'];

const FALLBACK_AVATAR =
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80';

const isRenderableImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const value = url.trim();
    if (!value) return false;
    if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\') || value.startsWith('/Users/') || value.startsWith('/home/')) {
        return false;
    }
    try {
        const parsed = new URL(value);
        return (
            ['http:', 'https:'].includes(parsed.protocol) &&
            !['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)
        );
    } catch {
        return false;
    }
};

function RoommateOnboarding() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dataUser, fetchAuth } = useStore();
    const isEditMode = new URLSearchParams(location.search).get('edit') === '1';
    const [avatarUrl, setAvatarUrl] = useState(
        isRenderableImageUrl(dataUser?.avatar) ? dataUser.avatar : '',
    );
    const [profileImages, setProfileImages] = useState([]);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [formData, setFormData] = useState({
        bio: '',
        location: 'Hà Nội',
        age: 22,
        gender: '',
        studentStatus: 'Sinh viên',
        budget: 4000000,
        lifestyle: ['Sạch sẽ', 'Yên tĩnh'],
        interests: ['Travel', 'Reading'],
        distanceRadius: 20,
        preferences: ['Không hút thuốc', 'Làm việc từ xa'],
        isLookingForRoommate: true,
    });

    useEffect(() => {
        document.title = isEditMode ? 'Chỉnh sửa hồ sơ ghép trọ' : 'Onboarding ghép trọ';
    }, [isEditMode]);

    useEffect(() => {
        if (isRenderableImageUrl(dataUser?.avatar)) {
            setAvatarUrl(dataUser.avatar);
        }
        if (Array.isArray(dataUser?.roommateProfile?.images) && dataUser.roommateProfile.images.length) {
            const valid = dataUser.roommateProfile.images.filter(isRenderableImageUrl);
            setProfileImages(valid);
            if (valid[0]) {
                setAvatarUrl(valid[0]);
            }
        }
    }, [dataUser]);

    useEffect(() => {
        if (dataUser?.roommateProfile) {
            const profile = dataUser.roommateProfile;
            setFormData((prev) => ({
                ...prev,
                bio: profile.bio || prev.bio,
                location: profile.location || prev.location,
                age: profile.age || prev.age,
                gender: profile.gender || prev.gender,
                studentStatus: profile.studentStatus || prev.studentStatus,
                budget: profile.budget || prev.budget,
                lifestyle:
                    Array.isArray(profile.lifestyle) && profile.lifestyle.length
                        ? profile.lifestyle
                        : prev.lifestyle,
                interests:
                    Array.isArray(profile.interests) && profile.interests.length
                        ? profile.interests
                        : prev.interests,
                distanceRadius: profile.distanceRadius || prev.distanceRadius,
                preferences:
                    Array.isArray(profile.preferences) && profile.preferences.length
                        ? profile.preferences
                        : prev.preferences,
                isLookingForRoommate:
                    typeof profile.isLookingForRoommate === 'boolean'
                        ? profile.isLookingForRoommate
                        : prev.isLookingForRoommate,
            }));
        }
    }, [dataUser]);

    useEffect(() => {
        const hasValidRoommateProfile =
            !!dataUser?._id &&
            dataUser?.roommateProfile &&
            dataUser.roommateProfile.location;
        if (hasValidRoommateProfile && !isEditMode) {
            navigate('/roommate/discover', { replace: true });
        }
    }, [dataUser, isEditMode, navigate]);

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddImageUrl = () => {
        const value = imageUrlInput.trim();
        if (!isRenderableImageUrl(value) || !/^https?:\/\//i.test(value)) {
            message.error('Vui lòng nhập địa chỉ ảnh công khai bắt đầu bằng http:// hoặc https://');
            return;
        }
        if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(new URL(value).hostname)) {
            message.error('Địa chỉ ảnh phải truy cập được từ internet, không dùng localhost');
            return;
        }
        if (profileImages.includes(value)) {
            message.warning('Địa chỉ ảnh này đã được thêm');
            return;
        }
        if (profileImages.length >= 6) {
            message.error('Tối đa 6 ảnh');
            return;
        }

        const nextImages = [...profileImages, value];
        setProfileImages(nextImages);
        setAvatarUrl(nextImages[0]);
        setImageUrlInput('');
    };

    const removeImage = (imageUrl) => {
        const nextImages = profileImages.filter((img) => img !== imageUrl);
        setProfileImages(nextImages);
        if (nextImages.length) {
            setAvatarUrl(nextImages[0]);
        } else {
            setAvatarUrl(isRenderableImageUrl(dataUser?.avatar) ? dataUser.avatar : '');
        }
    };

    const handleContinue = async () => {
        if (!formData.bio.trim()) {
            message.error('Vui lòng điền mô tả ngắn về bạn');
            return;
        }

        if (!formData.location.trim()) {
            message.error('Vui lòng nhập khu vực bạn đang sống');
            return;
        }

        if (!formData.gender) {
            message.error('Vui lòng chọn giới tính ghép trọ trong phần thông tin cá nhân');
            return;
        }

        const safeImages = profileImages.filter(isRenderableImageUrl);
        try {
            const saveResponse = await requestSaveRoommateProfile({
                ...formData,
                images: safeImages,
                budget: Number(formData.budget),
                age: Number(formData.age),
                distanceRadius: Number(formData.distanceRadius),
            });
            if (saveResponse?.metadata?.gender !== formData.gender) {
                message.error('Máy chủ chưa lưu đúng giới tính đã chọn. Vui lòng thử lưu lại.');
                return;
            }
            try {
                await fetchAuth();
            } catch {
                message.error('Hồ sơ đã được lưu nhưng không thể làm mới thông tin tài khoản. Vui lòng tải lại trang.');
                return;
            }
            message.success(isEditMode ? 'Đã cập nhật hồ sơ ghép trọ thành công' : 'Đã lưu hồ sơ ghép trọ thành công');
            navigate('/roommate/discover');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể lưu hồ sơ ghép trọ');
        }
    };

    const previewList = (profileImages.length
        ? profileImages
        : [avatarUrl || dataUser?.avatar]
    ).filter(isRenderableImageUrl);

    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                <div className={styles.eyebrow}>HOMIEHUB <span>•</span> KẾT NỐI BẠN CÙNG NHÀ</div>
                <h1>{isEditMode ? 'Hoàn thiện hồ sơ của bạn' : 'Tìm người bạn ở ghép phù hợp'}</h1>
                <p>Chia sẻ một chút về nếp sống và mong muốn của bạn để tìm người có thể cùng xây dựng một không gian sống thoải mái.</p>
                <div className={styles.steps} aria-label="Các bước tạo hồ sơ">
                    <span className={styles.stepActive}><b>1</b> Hồ sơ</span>
                    <span className={styles.stepLine} />
                    <span><b>2</b> Khám phá</span>
                    <span className={styles.stepLine} />
                    <span><b>3</b> Kết nối</span>
                </div>
            </header>

            <div className={styles.form}>
                <div className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionIcon}>📸</span>
                        <div><h2>Ảnh hồ sơ</h2><p>Ảnh rõ nét giúp bạn tạo thiện cảm ngay từ lần đầu.</p></div>
                        <span className={styles.counter}>{profileImages.length}/6</span>
                    </div>
                    <div className={styles.helperText} style={{ color: '#777', fontSize: 13, marginBottom: 12 }}>
                        Thêm URL ảnh công khai trên internet để ảnh vẫn hiển thị sau khi deploy.
                    </div>
                    <div className={styles.photoList} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        {previewList.length ? (
                            previewList.map((image, index) => (
                                <div className={styles.photoPreview} key={`${image}-${index}`} style={{ position: 'relative' }}>
                                    <img
                                        src={image}
                                        alt="profile"
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 14,
                                            objectFit: 'cover',
                                            border: '2px solid #fff',
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_AVATAR;
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(image)}
                                        style={{
                                            position: 'absolute',
                                            top: -6,
                                            right: -6,
                                            border: 'none',
                                            borderRadius: '50%',
                                            background: '#111',
                                            color: '#fff',
                                            width: 20,
                                            height: 20,
                                            cursor: 'pointer',
                                            fontSize: 12,
                                        }}
                                    >
                                        <DeleteOutlined />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#888', fontSize: 14 }}>Chưa có ảnh. Dán URL ảnh để thêm vào hồ sơ.</div>
                        )}
                    </div>
                    <div className={styles.urlRow} style={{ display: 'flex', gap: 8 }}>
                        <Input
                            value={imageUrlInput}
                            onChange={(event) => setImageUrlInput(event.target.value)}
                            onPressEnter={(event) => {
                                event.preventDefault();
                                handleAddImageUrl();
                            }}
                            placeholder="https://example.com/images/avatar.jpg"
                            disabled={profileImages.length >= 6}
                        />
                        <Button icon={<PlusOutlined />} onClick={handleAddImageUrl} disabled={profileImages.length >= 6}>
                            Thêm ảnh
                        </Button>
                    </div>
                    <div className={styles.helperText} style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
                        Dùng URL http/https có thể truy cập công khai; tối đa 6 ảnh. Không dùng đường dẫn file hoặc localhost.
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionIcon}>✍️</span>
                        <div><h2>Giới thiệu về bạn</h2><p>Điều gì khiến bạn trở thành một người bạn cùng nhà tuyệt vời?</p></div>
                    </div>
                    <Input.TextArea
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        rows={3}
                        maxLength={300}
                        showCount
                        placeholder="Ví dụ: Mình gọn gàng, thích không gian yên tĩnh, thường nấu ăn tại nhà..."
                        style={{ borderRadius: 14, border: '1px solid #e5e5e5', fontSize: 18 }}
                    />
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionIcon}>🧭</span>
                        <div><h2>Thông tin cơ bản</h2><p>Chọn đúng giới tính để chỉ nhận gợi ý cùng giới tính.</p></div>
                    </div>
                    <div className={styles.fieldGrid}>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Khu vực</div>
                            <Input value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Tuổi</div>
                            <InputNumber
                                min={18}
                                max={40}
                                value={formData.age}
                                onChange={(value) => updateField('age', value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <div style={{ marginBottom: 4, fontWeight: 600 }}>Giới tính ghép trọ</div>
                            <Select
                                value={formData.gender || undefined}
                                onChange={(value) => updateField('gender', value)}
                                placeholder="Chọn giới tính"
                                style={{ width: '100%' }}
                                options={genderOptions.map((item) => ({ label: item, value: item }))}
                            />
                            <div style={{ color: '#777', fontSize: 12, marginTop: 4 }}>
                                Ghép cùng giới tính được chọn ở đây; nội dung bio không quyết định giới tính.
                            </div>
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Trạng thái</div>
                            <Select
                                value={formData.studentStatus}
                                onChange={(value) => updateField('studentStatus', value)}
                                style={{ width: '100%' }}
                                options={studentStatusOptions.map((item) => ({ label: item, value: item }))}
                            />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Ngân sách / tháng</div>
                            <InputNumber
                                min={1000000}
                                step={500000}
                                value={formData.budget}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/,/g, '')}
                                onChange={(value) => updateField('budget', value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionIcon}>✨</span>
                        <div><h2>Nếp sống & sở thích</h2><p>Tìm người có thói quen và năng lượng phù hợp với bạn.</p></div>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <div className={styles.fieldLabel}>Nếp sống</div>
                            <Checkbox.Group
                                options={lifestyleOptions}
                                value={formData.lifestyle}
                                onChange={(value) => updateField('lifestyle', value)}
                            />
                        </div>
                        <div>
                            <div className={styles.fieldLabel}>Sở thích</div>
                            <Checkbox.Group
                                options={interestOptions}
                                value={formData.interests}
                                onChange={(value) => updateField('interests', value)}
                            />
                        </div>
                        <div>
                            <div className={styles.fieldLabel}>Khoảng cách tìm kiếm tối đa</div>
                            <InputNumber
                                min={5}
                                max={50}
                                value={formData.distanceRadius}
                                onChange={(value) => updateField('distanceRadius', value)}
                                style={{ width: 160 }}
                            />
                            <span style={{ marginLeft: 8 }}>km</span>
                        </div>
                        <div>
                            <div className={styles.fieldLabel}>Mong muốn về bạn cùng nhà</div>
                            <Checkbox.Group
                                options={preferenceOptions}
                                value={formData.preferences}
                                onChange={(value) => updateField('preferences', value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={`${styles.section} ${styles.availability}`}>
                    <div>
                        <strong>Hiển thị hồ sơ trong danh sách tìm bạn</strong>
                        <p>Tắt tùy chọn này nếu bạn chưa muốn nhận lượt thích mới.</p>
                    </div>
                    <Checkbox
                        checked={formData.isLookingForRoommate}
                        onChange={(e) => updateField('isLookingForRoommate', e.target.checked)}
                    />
                </div>
            </div>

            <Button
                type="primary"
                size="large"
                block
                onClick={handleContinue}
                style={{
                    height: 56,
                    borderRadius: 999,
                    background: '#16a765',
                    border: 'none',
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 24,
                }}
            >
                {isEditMode ? 'Lưu thay đổi' : 'Tiếp tục'}
            </Button>
        </div>
    );
}

export default RoommateOnboarding;