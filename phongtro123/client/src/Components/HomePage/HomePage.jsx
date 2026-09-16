import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import CardBody from '../CardBody/CardBody';
import { useState, useEffect } from 'react';
import { requestGetNewPost, requestGetPosts, requestPostSuggest } from '../../config/request';

import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function HomePage() {
    const [dataPost, setDataPost] = useState([]);

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
    // Default typeNews to 'vip' if not in URL
    const [typeNews, setTypeNews] = useState(() => getQueryParam('typeNews'));

    const toggleValue = (currentValue, setter, value) => {
        setter(currentValue === value ? '' : value);
    };

    useEffect(() => {
        const fetchData = async () => {
            const params = {
                category,
                priceRange,
                areaRange,
                typeNews,
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

            const queryString = queryParams.toString();
            const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
            window.history.pushState({ path: newUrl }, '', newUrl);
        };
        fetchData();
    }, [category, priceRange, areaRange, typeNews]);

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
                    </div>
                </div>

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
