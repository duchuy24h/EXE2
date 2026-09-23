import { useState, useEffect } from 'react';
import { message, Input, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { requestSendRoommateOtp, requestVerifyRoommateOtp } from '../../config/request';
import { useStore } from '../../hooks/useStore';

const OTP_LENGTH = 6;

function RoommateVerify() {
    const navigate = useNavigate();
    const { dataUser } = useStore();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [isSent, setIsSent] = useState(false);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        document.title = 'Xác minh email';
    }, []);

    useEffect(() => {
        const hasValidRoommateProfile = !!dataUser?._id && dataUser?.emailVerified && dataUser?.roommateProfile && dataUser.roommateProfile.location;
        if (hasValidRoommateProfile) {
            navigate('/roommate/discover', { replace: true });
        }
    }, [dataUser, navigate]);

    useEffect(() => {
        if (!isSent || timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isSent, timer]);

    useEffect(() => {
        if (timer === 0) {
            message.info('Mã OTP đã hết hạn. Hãy gửi lại mã mới.');
        }
    }, [timer]);

    const handleSendOtp = async () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            message.error('Vui lòng nhập email hợp lệ');
            return;
        }

        try {
            await requestSendRoommateOtp({ email });
            setIsSent(true);
            setTimer(60);
            message.success('Mã OTP đã được gửi đến email của bạn');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể gửi OTP');
        }
    };

    const handleOtpChange = (value, index) => {
        const nextOtp = [...otp];
        nextOtp[index] = value.replace(/\D/g, '').slice(0, 1);
        setOtp(nextOtp);

        if (value && index < OTP_LENGTH - 1) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmitOtp = async () => {
        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            message.error('Vui lòng nhập đủ 6 chữ số');
            return;
        }

        try {
            const res = await requestVerifyRoommateOtp({ otp: code });
            message.success(res.message);
            navigate('/roommate/onboarding');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Xác minh thất bại');
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Xác minh email</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>Tìm bạn ở ghép</div>

            {!isSent ? (
                <>
                    <div style={{ marginBottom: 12, fontSize: 16 }}>Nhập email để nhận mã OTP</div>
                    <Input
                        size="large"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ marginBottom: 16 }}
                    />
                    <Button type="primary" size="large" block onClick={handleSendOtp}>
                        Gửi mã OTP
                    </Button>
                </>
            ) : (
                <>
                    <div style={{ marginBottom: 12, fontSize: 16 }}>
                        Mã xác minh đã gửi tới <strong>{email}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '20px 0' }}>
                        {otp.map((value, index) => (
                            <Input
                                key={index}
                                id={`otp-${index}`}
                                value={value}
                                maxLength={1}
                                onChange={(e) => handleOtpChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                style={{
                                    width: 52,
                                    height: 52,
                                    fontSize: 24,
                                    textAlign: 'center',
                                    borderRadius: 10,
                                }}
                            />
                        ))}
                    </div>

                    <Button type="primary" size="large" block onClick={handleSubmitOtp} style={{ marginBottom: 10 }}>
                        Xác minh
                    </Button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <span style={{ color: '#666' }}>
                            {timer > 0 ? `Mã hết hạn sau: ${timer}s` : 'Mã OTP đã hết hạn'}
                        </span>
                        <Button type="link" disabled={timer > 0} onClick={handleSendOtp}>
                            Gửi lại
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

export default RoommateVerify;
