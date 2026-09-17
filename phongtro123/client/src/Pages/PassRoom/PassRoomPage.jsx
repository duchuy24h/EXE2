import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './PassRoomPage.module.scss';
import { requestGetPassRooms } from '../../config/request';

const cx = classNames.bind(styles);

function PassRoomPage() {
    const [items, setItems] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = 'Pass đồ trọ & Affiliate decor';
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await requestGetPassRooms();
                setItems(res.metadata || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredItems = useMemo(() => {
        if (activeFilter === 'all') return items;
        return items.filter((item) => item.kind === activeFilter);
    }, [items, activeFilter]);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('hero')}>
                <div className={cx('heroContent')}>
                    <span className={cx('eyebrow')}>Dịch vụ nâng cấp</span>
                    <h1>Pass đồ trọ & Affiliate decor</h1>
                    <p>
                        Gói bài nổi bật, phong cách sống đẹp, decor chuẩn khu vực và pass đồ trọ giúp chủ nhà
                        tiếp cận khách hàng đúng nhu cầu.
                    </p>
                </div>
                <div className={cx('heroStats')}>
                    <div>
                        <strong>{items.length}</strong>
                        <span>Gói đang mở</span>
                    </div>
                    <div>
                        <strong>{items.filter((item) => item.kind === 'affiliate-decor').length}</strong>
                        <span>Affiliate decor</span>
                    </div>
                    <div>
                        <strong>{items.filter((item) => item.kind === 'pass-room').length}</strong>
                        <span>Pass đồ trọ</span>
                    </div>
                </div>
            </div>

            <div className={cx('filters')}>
                <button className={cx({ active: activeFilter === 'all' })} onClick={() => setActiveFilter('all')}>
                    Tất cả
                </button>
                <button className={cx({ active: activeFilter === 'pass-room' })} onClick={() => setActiveFilter('pass-room')}>
                    Pass đồ trọ
                </button>
                <button className={cx({ active: activeFilter === 'affiliate-decor' })} onClick={() => setActiveFilter('affiliate-decor')}>
                    Affiliate decor
                </button>
            </div>

            {loading ? (
                <div className={cx('loading')}>Đang tải...</div>
            ) : (
                <div className={cx('grid')}>
                    {filteredItems.map((item) => (
                        <Link to={`/pass-room/${item._id}`} className={cx('card')} key={item._id}>
                            <div className={cx('imageWrap')}>
                                <img src={item.images?.[0]} alt={item.title} />
                                <span className={cx(item.kind === 'affiliate-decor' ? 'tagDecor' : 'tagPass')}>
                                    {item.kind === 'affiliate-decor' ? 'Affiliate decor' : 'Pass đồ trọ'}
                                </span>
                            </div>
                            <div className={cx('content')}>
                                <h3>{item.title}</h3>
                                <p>{item.location}</p>
                                <div className={cx('meta')}>
                                    <strong>{Number(item.price || 0).toLocaleString('vi-VN')} VNĐ</strong>
                                    <span>{item.area} m²</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PassRoomPage;
