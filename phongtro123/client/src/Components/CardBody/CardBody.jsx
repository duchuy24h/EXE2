import classNames from 'classnames/bind';
import styles from './CardBody.module.scss';

import { DollarOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';

import imgDefault from '../../assets/images/img_default.svg';

import { Link } from 'react-router-dom';

import dayjs from 'dayjs';

const cx = classNames.bind(styles);

function getSafeImages(post) {
    if (!post || !Array.isArray(post.images)) return [];
    return post.images.filter((url) => typeof url === 'string' && url.trim());
}

function handleImgError(e) {
    if (e?.currentTarget) {
        e.currentTarget.onerror = null;
        e.currentTarget.src = imgDefault;
    }
}

function CardBody({ post }) {
    const images = getSafeImages(post);
    const img0 = images[0] || imgDefault;
    const img1 = images[1] || imgDefault;
    const img2 = images[2] || imgDefault;
    const img3 = images[3] || imgDefault;

    return (
        <div className={cx('list-item')}>
            <Link to={`/chi-tiet-tin-dang/${post._id}`}>
                <div className={cx('parent')}>
                    <div className={cx('div1')}>
                        <img src={img0} alt="" onError={handleImgError} />
                    </div>
                    <div className={cx('div2')}>
                        <img src={img1} alt="" onError={handleImgError} />
                    </div>
                    <div className={cx('div3')}>
                        <img src={img2} alt="" onError={handleImgError} />
                    </div>
                    <div className={cx('div4')}>
                        <img src={img3} alt="" onError={handleImgError} />
                    </div>
                </div>
            </Link>
            <div className={cx('room-info')}>
                <div className={cx('title-row')}>
                    <h2 className={cx('room-title')}>
                        <HomeOutlined className={cx('icon')} />
                        {post.title}
                    </h2>
                    {post.kind === 'pass-room' && <span className={cx('badge-pass')}>Pass đồ trọ</span>}
                    {post.kind === 'affiliate-decor' && <span className={cx('badge-decor')}>Affiliate decor</span>}
                </div>
                <div className={cx('room-meta')}>
                    <span className={cx('price')}>
                        <DollarOutlined className={cx('icon')} />
                        {Number(post.price || 0).toLocaleString()} VNĐ/tháng
                    </span>
                    <span className={cx('area')}>
                        <HomeOutlined className={cx('icon')} />
                        {post.area} m²
                    </span>
                    <span className={cx('location')}>
                        <EnvironmentOutlined className={cx('icon')} />
                        {post.location}
                    </span>
                </div>
            </div>
            <div className={cx('user-info')}>
                <img src={post.user?.avatar || imgDefault} alt="" onError={handleImgError} />
                <div className={cx('info-container')}>
                    <div className={cx('user-header')}>
                        <h4>{post.user?.fullName}</h4>
                        <span>{dayjs(post.createdAt).format('HH:MM DD/MM/YYYY')}</span>
                    </div>
                    <div className={cx('user-actions')}>
                        <span>{post.phone}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardBody;