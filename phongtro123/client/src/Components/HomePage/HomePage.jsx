import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import CardBody from '../CardBody/CardBody';
import { useState, useEffect } from 'react';
import { requestGetNewPost, requestGetPassRooms, requestGetPosts, requestPostSuggest } from '../../config/request';

import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';

const cx = classNames.bind(styles);

function HomePage() {
    const { dataUser } = useStore();
    const [dataPost, setDataPost] = useState([]);
    const [dataPassRoom, setDataPassRoom] = useState([]);

    const categoryOptions = [
        { value: 'phong-tro', label: 'Phòng trọ' },
        { value: 'nha-nguyen-can', label: 'Nhà nguyên căn' },
        { value: 'can-ho-chung-cu', label: 'Căn hộ chung cư' },
        { value: 'can-ho-mini', label: 'Căn hộ mini' },
    ];

    const priceOptions = [
        { value: 'duoi-1-trieu', label: 'Dưới 1 triệu' },
        { value: 'tu-1-2-trieu', label: '1 - 2 triệu' },
        { value: 'tu-2-3-trieu', label: '2 - 3 triệu' },
        { value: 'tu-3-5-trieu', label: '3 - 5 triệu' },
        { value: 'tu-5-7-trieu', label: '5 - 7 triệu' },
        { value: 'tu-7-10-trieu', label: '7 - 10 triệu' },
        { value: 'tu-10-15-trieu', label: '10 - 15 triệu' },
        { value: 'tren-15-trieu', label: 'Trên 15 triệu' },
    ];

    const areaOptions = [
        { value: 'duoi-20', label: 'Dưới 20 m²' },
        { value: 'tu-20-30', label: '20 - 30 m²' },
        { value: 'tu-30-50', label: '30 - 50 m²' },
        { value: 'tu-50-70', label: '50 - 70 m²' },
        { value: 'tu-70-90', label: '70 - 90 m²' },
        { value: 'tren-90', label: 'Trên 90 m²' },
    ];

    useEffect(() => {
        document.title = 'Trang chủ';
    }, []);

    // Initialize state from URL parameters on mount
    const getQueryParam = (param) => new URLSearchParams(window.location.search).get(param);

    const [category, setCategory] = useState(() => getQueryParam('category') || '');
    const [priceRange, setPriceRange] = useState(() => getQueryParam('priceRange') || '');
    const [areaRange, setAreaRange] = useState(() => getQueryParam('areaRange') || '');
    const [passRoomKind, setPassRoomKind] = useState(() => getQueryParam('passRoomKind') || '');
    // Default typeNews to 'vip' if not in URL
    const [typeNews, setTypeNews] = useState(() => getQueryParam('typeNews'));

    const toggleValue = (currentValue, setter, value) => {
        setter(currentValue === value ? '' : value);
    };

    const isRoommateReady = !!dataUser?._id && dataUser?.emailVerified && dataUser?.roommateProfile && dataUser.roommateProfile.location;

    useEffect(() => {
        const fetchData = async () => {
            const params = {
                category,
                priceRange,
                areaRange,
                typeNews,
                passRoomKind,
            };
            console.log('>>> Sending params to API:', params);
            const res = await requestGetPosts(params);
            setDataPost(res.metadata);

            // Update URL
            const queryParams = new URLSearchParams();
            if (category) queryParams.set('category', category);
            if (priceRange) queryParams.set('priceRange', priceRange);
            if (areaRange) queryParams.set('areaRange', areaRange);
            if (typeNews) queryParams.set('typeNews', typeNews);
            if (passRoomKind) queryParams.set('passRoomKind', passRoomKind);

            const queryString = queryParams.toString();
            const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
            window.history.pushState({ path: newUrl }, '', newUrl);
        };
        fetchData();
    }, [category, priceRange, areaRange, typeNews, passRoomKind]);

    const [dataNewPost, setDataNewPost] = useState([]);
    const [dataPostSuggest, setDataPostSuggest] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await requestGetNewPost();
            const resSuggest = await requestPostSuggest();
            setDataNewPost(res.metadata);
            setDataPostSuggest(resSuggest.metadata);
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchPassRoomData = async () => {
            const params = passRoomKind ? { kind: passRoomKind } : {};
            const res = await requestGetPassRooms(params);
            setDataPassRoom(res.metadata || []);
        };
        fetchPassRoomData();
    }, [passRoomKind]);

    const featuredAffiliate = dataPassRoom.find((item) => item.kind === 'affiliate-decor') || dataPassRoom[0];
    const [carouselIndex, setCarouselIndex] = useState(0);
    const visiblePassRoomCards = dataPassRoom.slice(carouselIndex, carouselIndex + 3);

    useEffect(() => {
        if (dataPassRoom.length <= 3) return;
        const interval = setInterval(() => {
            setCarouselIndex((prev) => (prev + 3 >= dataPassRoom.length ? 0 : prev + 3));
        }, 4800);
        return () => clearInterval(interval);
    }, [dataPassRoom.length]);

    const moveCarousel = (direction) => {
        if (!dataPassRoom.length) return;
        setCarouselIndex((prev) => {
            const size = 3;
            const next = prev + direction * size;
            if (next < 0) return Math.max(0, dataPassRoom.length - (dataPassRoom.length % size || size));
            if (next >= dataPassRoom.length) return 0;
            return next;
        });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Kênh thông tin Phòng trọ số 1 Việt Nam</h1>
                    <p className={cx('description')}>Đây là nơi bạn có thể tìm thấy thông tin và dịch vụ tốt nhất.</p>
                    <p className={cx('description-1')}>có {dataPost.length} tin đang cho thuê</p>

                    <div className={cx('actions')}>
                        <button onClick={() => setTypeNews('vip')} id={cx(typeNews === 'vip' && 'active')}>
                            Đề xuất
                        </button>
                        <button onClick={() => setTypeNews('normal')} id={cx(typeNews === 'normal' && 'active')}>
                            Mới đăng
                        </button>
                        <Link to={isRoommateReady ? '/roommate/discover' : '/roommate/verify'} className={cx('roommate-cta')}>
                            Tìm người ghép trọ
                        </Link>
                    </div>
                </div>

                {dataPassRoom.length > 0 && (
                    <div className={cx('feature-passroom')}>
                        <div className={cx('feature-header')}>
                            <div>
                                <span className={cx('feature-label')}>Dịch vụ đặc biệt</span>
                                <h2>Pass đồ trọ & Affiliate decor</h2>
                            </div>
                            <Link to="/pass-room" className={cx('feature-pill')}>Xem tất cả</Link>
                        </div>

                        {featuredAffiliate && (
                            <Link to={`/pass-room/${featuredAffiliate._id}`} className={cx('feature-hero')}>
                                <div className={cx('feature-heroImage')}>
                                    <img src={featuredAffiliate.images?.[0]} alt={featuredAffiliate.title} />
                                </div>
                                <div className={cx('feature-heroContent')}>
                                    <span className={cx('feature-badge')}>
                                        {featuredAffiliate.kind === 'affiliate-decor' ? 'Affiliate decor' : 'Pass đồ trọ'}
                                    </span>
                                    <h3>{featuredAffiliate.title}</h3>
                                    <p>{featuredAffiliate.description}</p>
                                    <div className={cx('feature-meta')}>
                                        <span>{featuredAffiliate.location}</span>
                                        <strong>{featuredAffiliate.price?.toLocaleString('vi-VN')} VNĐ</strong>
                                    </div>
                                </div>
                            </Link>
                        )}

                        <div className={cx('feature-carouselControls')}>
                            <button type="button" onClick={() => moveCarousel(-1)}>←</button>
                            <button type="button" onClick={() => moveCarousel(1)}>→</button>
                        </div>

                        <div className={cx('feature-grid')}>
                            {visiblePassRoomCards.map((item) => (
                                <Link to={`/pass-room/${item._id}`} className={cx('feature-card')} key={item._id || item.title}>
                                    <div className={cx('feature-cardImage')}>
                                        <img src={item.images?.[0]} alt={item.title} />
                                    </div>
                                    <div className={cx('feature-cardBody')}>
                                        <span className={cx(item.kind === 'affiliate-decor' ? 'feature-cardTagDecor' : 'feature-cardTagPass')}>
                                            {item.kind === 'affiliate-decor' ? 'Affiliate decor' : 'Pass đồ trọ'}
                                        </span>
                                        <h4>{item.title}</h4>
                                        <p>{item.location}</p>
                                        <div className={cx('feature-cardFooter')}>
                                            <strong>{item.price?.toLocaleString('vi-VN')} VNĐ</strong>
                                            <span>{item.area} m²</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className={cx('list-content')}>
                    {dataPost.map((post) => (
                        <CardBody key={post._id} post={post} />
                    ))}
                </div>
            </div>
            <div className={cx('filter')}>
                <div className={cx('filter-section')}>
                    <h3>Loại hình</h3>
                    <div className={cx('filter-list')}>
                        {categoryOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cx('filter-chip', { active: category === option.value })}
                                onClick={() => toggleValue(category, setCategory, option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Dịch vụ đặc biệt</h3>
                    <div className={cx('filter-list')}>
                        <button
                            type="button"
                            className={cx('filter-chip', { active: passRoomKind === 'pass-room' })}
                            onClick={() => toggleValue(passRoomKind, setPassRoomKind, 'pass-room')}
                        >
                            Pass đồ trọ
                        </button>
                        <button
                            type="button"
                            className={cx('filter-chip', { active: passRoomKind === 'affiliate-decor' })}
                            onClick={() => toggleValue(passRoomKind, setPassRoomKind, 'affiliate-decor')}
                        >
                            Affiliate decor
                        </button>
                    </div>
                </div>
                <div className={cx('filter-section')}>
                    <h3>Xem theo khoảng giá</h3>
                    <div className={cx('filter-list')}>
                        {priceOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cx('filter-chip', { active: priceRange === option.value })}
                                onClick={() => toggleValue(priceRange, setPriceRange, option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Xem theo diện tích</h3>
                    <div className={cx('filter-list')}>
                        {areaOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cx('filter-chip', { active: areaRange === option.value })}
                                onClick={() => toggleValue(areaRange, setAreaRange, option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Tin mới đăng</h3>
                    <div className={cx('new-posts')}>
                        {dataNewPost.map((item) => (
                            <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                                <div className={cx('post-item')}>
                                    <div className={cx('post-image')}>
                                        <img src={item.images[0]} alt="Studio apartment" />
                                    </div>
                                    <div className={cx('post-info')}>
                                        <h4 className={cx('post-title')}>{item.title}</h4>
                                        <div className={cx('post-meta')}>
                                            <span className={cx('post-price')}>
                                                {item.price.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                            <span className={cx('post-time')}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className={cx('filter-section')}>
                    <h3>Gần bạn</h3>
                    <div className={cx('new-posts')}>
                        {dataPostSuggest.map((item) => (
                            <Link to={`/chi-tiet-tin-dang/${item._id}`} key={item._id}>
                                <div className={cx('post-item')}>
                                    <div className={cx('post-image')}>
                                        <img src={item.images[0]} alt="Studio apartment" />
                                    </div>
                                    <div className={cx('post-info')}>
                                        <h4 className={cx('post-title')}>{item.title}</h4>
                                        <div className={cx('post-meta')}>
                                            <span className={cx('post-price')}>
                                                {item.price.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                            <span className={cx('post-time')}>
                                                {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
