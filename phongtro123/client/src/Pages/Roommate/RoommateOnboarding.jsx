import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Input, InputNumber, Select, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestSaveRoommateProfile, requestUploadImages } from '../../config/request';
import { useStore } from '../../hooks/useStore';

const genderOptions = ['Nam', 'Nữ', 'Khác'];
const studentStatusOptions = ['Sinh viên', 'Đã tốt nghiệp', 'Đi làm', 'Khác'];
const preferredGenderOptions = ['Tất cả', 'Nam', 'Nữ', 'Khác'];
const lifestyleOptions = ['Sạch sẽ', 'Yên tĩnh', 'Làm việc từ xa', 'Cuối tuần đi chơi', 'Dễ thích nghi', 'Thích đi chơi', 'Ngủ sớm'];
const interestOptions = ['Yoga', 'Travel', 'Reading', 'Gym', 'Coffee', 'Music', 'Gaming', 'Film', 'Study', 'Cooking'];
const preferenceOptions = ['Không hút thuốc', 'Làm việc từ xa', 'Có pet', 'Không có pet', 'Tự do về giờ giấc'];

function RoommateOnboarding() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dataUser } = useStore();
    const isEditMode = new URLSearchParams(location.search).get('edit') === '1';
    const [avatarUrl, setAvatarUrl] = useState(dataUser?.avatar || '');
    const [profileImages, setProfileImages] = useState([]);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        bio: '',
        location: 'Hà Nội',
        age: 22,
        gender: 'Nữ',
        studentStatus: 'Sinh viên',
        budget: 4000000,
        preferredGender: 'Tất cả',
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
        if (dataUser?.avatar) {
            setAvatarUrl(dataUser.avatar);
        }
        if (Array.isArray(dataUser?.roommateProfile?.images) && dataUser.roommateProfile.images.length) {
            setProfileImages(dataUser.roommateProfile.images);
            setAvatarUrl(dataUser.roommateProfile.images[0]);
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
                preferredGender: profile.preferredGender || prev.preferredGender,
                lifestyle: Array.isArray(profile.lifestyle) && profile.lifestyle.length ? profile.lifestyle : prev.lifestyle,
                interests: Array.isArray(profile.interests) && profile.interests.length ? profile.interests : prev.interests,
                distanceRadius: profile.distanceRadius || prev.distanceRadius,
                preferences: Array.isArray(profile.preferences) && profile.preferences.length ? profile.preferences : prev.preferences,
                isLookingForRoommate: typeof profile.isLookingForRoommate === 'boolean' ? profile.isLookingForRoommate : prev.isLookingForRoommate,
            }));
        }
    }, [dataUser]);

    useEffect(() => {
        const hasValidRoommateProfile = !!dataUser?._id && dataUser?.emailVerified && dataUser?.roommateProfile && dataUser.roommateProfile.location;
        if (hasValidRoommateProfile && !isEditMode) {
            navigate('/roommate/discover', { replace: true });
        }
    }, [dataUser, isEditMode, navigate]);

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSelectImages = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const invalidFile = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
        if (invalidFile) {
            message.error('Chỉ cho phép JPG, PNG hoặc WEBP');
            return;
        }

        const oversized = files.find((file) => file.size > 2 * 1024 * 1024);
        if (oversized) {
            message.error('Mỗi ảnh phải nhỏ hơn 2MB');
            return;
        }

        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));

        try {
            const response = await requestUploadImages(formData);
            const uploadedImages = response?.images || [];
            const nextImages = [...profileImages, ...uploadedImages].slice(0, 6);
            setProfileImages(nextImages);
            setAvatarUrl(nextImages[0] || avatarUrl);
            message.success(`Đã upload ${uploadedImages.length} ảnh`);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể upload ảnh');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (imageUrl) => {
        const nextImages = profileImages.filter((img) => img !== imageUrl);
        setProfileImages(nextImages);
        if (nextImages.length) {
            setAvatarUrl(nextImages[0]);
        } else {
            setAvatarUrl(dataUser?.avatar || '');
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

        try {
            await requestSaveRoommateProfile({
                ...formData,
                avatar: avatarUrl || dataUser?.avatar || '',
                images: profileImages.length ? profileImages : dataUser?.roommateProfile?.images || [],
                budget: Number(formData.budget),
                age: Number(formData.age),
                distanceRadius: Number(formData.distanceRadius),
            });
            message.success(isEditMode ? 'Đã cập nhật hồ sơ ghép trọ thành công' : 'Đã lưu hồ sơ ghép trọ thành công');
            navigate(isEditMode ? '/roommate/chats' : '/roommate/discover');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể lưu hồ sơ ghép trọ');
        }
    };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Bumble</div>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 26 }}>
                    <span>←</span>
                    <span>◌</span>
                </div>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ background: '#f3f3f3', borderRadius: 18, padding: '22px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Ảnh hồ sơ</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        {(profileImages.length ? profileImages : [avatarUrl || dataUser?.avatar]).filter(Boolean).map((image, index) => (
                            <div key={`${image}-${index}`} style={{ position: 'relative' }}>
                                <img
                                    src={image}
                                    alt="profile"
                                    style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '2px solid #fff' }}
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
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleSelectImages}
                    />
                    <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                        Tải tối đa 6 ảnh
                    </Button>
                </div>

                <div style={{ background: '#f3f3f3', borderRadius: 18, padding: '22px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 10 }}>My bio</div>
                    <Input.TextArea
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        rows={3}
                        placeholder="Ví dụ: Mình là người sạch sẽ, thích sống yên tĩnh, làm việc từ xa..."
                        style={{ borderRadius: 14, border: '1px solid #e5e5e5', fontSize: 18 }}
                    />
                </div>

                <div style={{ background: '#f3f3f3', borderRadius: 18, padding: '22px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Thông tin cá nhân</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Khu vực</div>
                            <Input value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Tuổi</div>
                            <InputNumber min={18} max={40} value={formData.age} onChange={(value) => updateField('age', value)} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Giới tính</div>
                            <Select value={formData.gender} onChange={(value) => updateField('gender', value)} style={{ width: '100%' }} options={genderOptions.map((item) => ({ label: item, value: item }))} />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Trạng thái</div>
                            <Select value={formData.studentStatus} onChange={(value) => updateField('studentStatus', value)} style={{ width: '100%' }} options={studentStatusOptions.map((item) => ({ label: item, value: item }))} />
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
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Giới tính ưu tiên</div>
                            <Select value={formData.preferredGender} onChange={(value) => updateField('preferredGender', value)} style={{ width: '100%' }} options={preferredGenderOptions.map((item) => ({ label: item, value: item }))} />
                        </div>
                    </div>
                </div>

                <div style={{ background: '#f3f3f3', borderRadius: 18, padding: '22px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Lifestyle và sở thích</div>
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Lifestyle</div>
                            <Checkbox.Group
                                options={lifestyleOptions}
                                value={formData.lifestyle}
                                onChange={(value) => updateField('lifestyle', value)}
                            />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Sở thích</div>
                            <Checkbox.Group
                                options={interestOptions}
                                value={formData.interests}
                                onChange={(value) => updateField('interests', value)}
                            />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>Khoảng cách tối đa</div>
                            <InputNumber min={5} max={50} value={formData.distanceRadius} onChange={(value) => updateField('distanceRadius', value)} style={{ width: 160 }} />
                            <span style={{ marginLeft: 8 }}>km</span>
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 600 }}>User preferences</div>
                            <Checkbox.Group
                                options={preferenceOptions}
                                value={formData.preferences}
                                onChange={(value) => updateField('preferences', value)}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ background: '#f3f3f3', borderRadius: 18, padding: '22px 18px' }}>
                    <Checkbox checked={formData.isLookingForRoommate} onChange={(e) => updateField('isLookingForRoommate', e.target.checked)}>
                        Tôi đang tìm bạn ở ghép
                    </Checkbox>
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
                    background: '#111',
                    border: 'none',
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 24,
                }}
            >
                Tiếp tục
            </Button>
        </div>
    );
}

export default RoommateOnboarding;
