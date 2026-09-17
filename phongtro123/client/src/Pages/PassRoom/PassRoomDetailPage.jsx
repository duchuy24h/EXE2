import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, message } from 'antd';
import classNames from 'classnames/bind';
import styles from './PassRoomDetailPage.module.scss';
import { requestGetPassRoomById, requestPurchasePassRoom } from '../../config/request';
import { useStore } from '../../hooks/useStore';

const cx = classNames.bind(styles);

function PassRoomDetailPage() {
    const { id } = useParams();
    const { dataUser, fetchAuth } = useStore();
    const [item, setItem] = useState(null);
    const [selectedImg, setSelectedImg] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchItem = async () => {
        try {
            const res = await requestGetPassRoomById(id);
            const data = res.metadata;
            setItem(data);
            setSelectedImg(data.images?.[0] || '');
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể tải chi tiết');
        }
    };

    useEffect(() => {
        if (id) fetchItem();
    }, [id]);

    const handlePurchase = async () => {
        if (!dataUser?._id) {
            message.warning('Bạn cần đăng nhập để mua gói');
            return;
        }

        setLoading(true);
        try {
            const res = await requestPurchasePassRoom({ passRoomId: item._id });
            message.success(res.message || 'Mua gói thành công');
            await fetchAuth();
            fetchItem();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Mua gói thất bại');
        } finally {
            setLoading(false);
        }
    };

    const hasShopLink = Boolean(item?.shopLink);

    if (!item) {
        return <div className={cx('loading')}>Đang tải chi tiết...</div>;
    }

    return (
        <div className={cx('wrapper')}>
            <div className={cx('content')}>
                <div className={cx('gallery')}>
                    <div className={cx('mainImage')}>
                        <img src={selectedImg} alt={item.title} />
                    </div>
                    <div className={cx('thumbs')}>
                        {item.images?.map((img, idx) => (
                            <button
                                key={`${img}-${idx}`}
                                type="button"
                                onClick={() => setSelectedImg(img)}
                                className={cx({ active: selectedImg === img })}
                            >
                                <img src={img} alt={item.title} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cx('info')}>
                    <span className={cx(item.kind === 'affiliate-decor' ? 'badgeDecor' : 'badgePass')}>
                        {item.kind === 'affiliate-decor' ? 'Affiliate decor' : 'Pass đồ trọ'}
                    </span>
                    <h1>{item.title}</h1>
                    <div className={cx('metaRow')}>
                        <span>{item.location}</span>
                        <span>{item.area} m²</span>
                    </div>
                    <div className={cx('price')}>{Number(item.price || 0).toLocaleString('vi-VN')} VNĐ</div>
                    <p>{item.description}</p>

                    <div className={cx('actions')}>
                        {hasShopLink ? (
                            <Button type="primary" size="large" href={item.shopLink} target="_blank" rel="noreferrer">
                                Xem quảng cáo / Mua ngay
                            </Button>
                        ) : (
                            <Button type="primary" size="large" loading={loading} onClick={handlePurchase}>
                                Mua gói - trừ tiền ngay
                            </Button>
                        )}
                        <div className={cx('balance')}>
                            Số dư hiện tại: <strong>{Number(dataUser?.balance || 0).toLocaleString('vi-VN')} VNĐ</strong>
                        </div>
                    </div>

                    {hasShopLink && (
                        <div className={cx('shopLinkBox')}>
                            <a href={item.shopLink} target="_blank" rel="noreferrer">
                                {item.shopLink}
                            </a>
                        </div>
                    )}

                    <div className={cx('seller')}>
                        <div className={cx('sellerAvatar')}>
                            <img src={item.seller?.avatar || 'https://via.placeholder.com/80'} alt={item.seller?.fullName} />
                        </div>
                        <div>
                            <strong>{item.seller?.fullName || 'Chủ sở hữu'}</strong>
                            <div>{item.seller?.phone || item.phone}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PassRoomDetailPage;
