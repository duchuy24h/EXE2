import classNames from 'classnames/bind';
import styles from './DetailPost.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPhoneAlt,
    faShareAlt,
    faFlag,
    faMapMarkerAlt,
    faExternalLinkAlt,
    faShoppingBag,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import userDefault from '../../assets/images/user-default.svg';

import dayjs from 'dayjs';

import {
    requestCreateFavourite,
    requestDeleteFavourite,
    requestGetPostById,
    requestGetPostVip,
} from '../../config/request';
import { useStore } from '../../hooks/useStore';
import { useSocket } from '../../hooks/useSocket';
import Messager from '../../utils/Messager/Messager';
import ChatButton from '../../utils/ChatButton/ChatButton';
import { message, Drawer } from 'antd';

const cx = classNames.bind(styles);

const isSafeHttpUrlClient = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith('javascript:') ||
        lower.startsWith('data:') ||
        lower.startsWith('vbscript:') ||
        lower.startsWith('file:')
    ) {
        return false;
    }
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

function DetailPost() {
    const [selectedImg, setSelectedImg] = useState('');
    const [user, setUser] = useState({});
    const [post, setPost] = useState({});
    const { id } = useParams();
    const [userHeart, setUserHeart] = useState([]);
    const [postVip, setPostVip] = useState([]);
    const [affDrawerOpen, setAffDrawerOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const fetchPost = async () => {
        try {
            setLoadError(false);
            const res = await requestGetPostById(id);
            const data = res?.metadata?.data;
            if (!data) {
                setLoadError(true);
                return;
            }
            setPost(data);
            setSelectedImg(data?.images?.[0] || '');
            setUser(res?.metadata?.dataUser || {});
            setUserHeart(res?.metadata?.userFavourite || []);
            document.title = `${data.title || 'Chi tiết'} - homiehub`;
        } catch {
            setLoadError(true);
            setPost({});
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    useEffect(() => {
        const fetchPostVip = async () => {
            try {
                const res = await requestGetPostVip();
                setPostVip(Array.isArray(res?.metadata) ? res.metadata : []);
            } catch {
                setPostVip([]);
            }
        };
        fetchPostVip();
    }, []);

    const { dataUser, setDataMessages } = useStore();
    const { usersMessage, setUsersMessage } = useSocket();

    const handleCreateFavourite = async () => {
        try {
            const data = { postId: post._id };
            const res = await requestCreateFavourite(data);
            fetchPost();
            message.success(res.message);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDeleteFavourite = async () => {
        try {
            const data = { postId: post._id };
            const res = await requestDeleteFavourite(data);
            fetchPost();
            message.error(res.message);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const affiliateProducts = useMemo(() => {
        if (!Array.isArray(post?.affiliateProducts)) return [];
        return post.affiliateProducts.filter((item) => {
            if (!item || typeof item !== 'object') return false;
            if (!item.name || typeof item.name !== 'string') return false;
            if (!item.link || !isSafeHttpUrlClient(item.link)) return false;
            return true;
        });
    }, [post?.affiliateProducts]);

    const hasAffiliate = affiliateProducts.length > 0;

    if (loadError) {
        return (
            <div className={cx('wrapper')}>
                <main className={cx('container')}>
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        Không tìm thấy bài đăng hoặc đã bị xóa.
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <main className={cx('container')}>
                <div className={cx('content')}>
                    <div className={cx('left')}>
                        <div className={cx('slider-container')}>
                            <div className={cx('slide-item')}>
                                {selectedImg ? <img src={selectedImg} alt="" /> : null}
                            </div>
                            <div className={cx('select-img')}>
                                {(post?.images || []).map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt=""
                                        onClick={() => setSelectedImg(image)}
                                    />
                                ))}
                            </div>

                            {hasAffiliate && (
                                <button
                                    type="button"
                                    className={cx('aff-float-btn')}
                                    onClick={() => setAffDrawerOpen(true)}
                                    aria-label="Xem đồ dùng gợi ý"
                                >
                                    <span className={cx('aff-float-icon')}>
                                        <FontAwesomeIcon icon={faShoppingBag} />
                                    </span>
                                    <span className={cx('aff-float-label')}>Đồ dùng</span>
                                    <span className={cx('aff-float-badge')}>{affiliateProducts.length}</span>
                                </button>
                            )}
                        </div>

                        <div className={cx('property-details')}>
                            <div className={cx('property-header')}>
                                {post?.typeNews === 'vip' && <span className={cx('vip-tag')}>TIN VIP NỔI BẬT</span>}
                                {post?.isPassRoom && <span className={cx('passroom-tag')}>Pass đồ trọ</span>}
                                {post?.isAffiliateDecor && <span className={cx('affiliate-tag')}>Affiliate decor</span>}
                                <h1 className={cx('property-title')}> {post?.title}</h1>
                                <div className={cx('property-location')}>
                                    <span>{post?.location}</span>
                                </div>
                                <div className={cx('property-meta')}>
                                    <div className={cx('price')}>
                                        {post?.price != null ? `${Number(post.price).toLocaleString()} VNĐ/tháng` : ''}
                                    </div>
                                    <div className={cx('area')}>{post?.area != null ? `${post.area} m²` : ''}</div>
                                </div>
                            </div>

                            <div className={cx('property-description')}>
                                <h2>Thông tin mô tả</h2>
                                <p dangerouslySetInnerHTML={{ __html: post?.description || '' }} />
                            </div>

                            <div className={cx('property-features')}>
                                <h2>Nổi bật</h2>
                                <div className={cx('features-grid')}>
                                    {(Array.isArray(post?.options) ? post.options : []).map((option, index) => (
                                        <div className={cx('feature-item')} key={index}>
                                            <span className={cx('feature-icon', 'check')}></span>
                                            <span>{option}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={cx('map-section')}>
                            <h3 className={cx('section-title')}>Vị trí & bản đồ</h3>
                            <div className={cx('map-container')}>
                                <div className={cx('address-bar')}>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className={cx('location-icon')} />
                                    <span className={cx('address-text')}>{post?.location}</span>
                                </div>
                                <div className={cx('map-frame')}>
                                    {post?.location ? (
                                        <iframe
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(post.location)}&output=embed`}
                                            width="600"
                                            height="450"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title="Property Location"
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cx('right')}>
                        <div className={cx('contact-card')}>
                            <div className={cx('user-info')}>
                                <div className={cx('avatar')}>
                                    <img src={user?.avatar || userDefault} alt="Avatar" />
                                </div>
                                <div className={cx('user-details')}>
                                    <h3 className={cx('user-name')}>{user?.username || user?.fullName}</h3>
                                    <div className={cx('user-status')}>
                                        <span className={cx('status-dot')}></span>
                                        <span className={cx('status-text')}>{user?.status || 'Đang hoạt động'}</span>
                                    </div>
                                    <div className={cx('user-stats')}>
                                        <span>{user?.lengthPost} tin đăng</span>
                                        <span className={cx('dot-separator')}></span>
                                        <span>
                                            Tham gia từ:{' '}
                                            {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('contact-buttons')}>
                                <a href={`tel:${user?.phone || ''}`} className={cx('btn', 'btn-phone')}>
                                    <FontAwesomeIcon icon={faPhoneAlt} />
                                    {user?.phone || 'chưa cập nhật'}
                                </a>
                                <ChatButton
                                    userId={user?._id}
                                    username={user?.username || user?.fullName}
                                    avatar={user?.avatar}
                                    status={user?.status}
                                    className={cx('btn', 'btn-zalo')}
                                    icon={false}
                                />
                            </div>

                            <div className={cx('action-buttons')}>
                                <button
                                    onClick={
                                        userHeart.find((item) => item === dataUser?._id)
                                            ? handleDeleteFavourite
                                            : handleCreateFavourite
                                    }
                                    className={cx('action-btn')}
                                >
                                    <FontAwesomeIcon icon={faHeart} />
                                    {userHeart.find((item) => item === dataUser?._id) ? 'Đã lưu' : 'Lưu tin'}
                                </button>
                                <button className={cx('action-btn')}>
                                    <FontAwesomeIcon icon={faShareAlt} />
                                    Chia sẻ
                                </button>
                            </div>
                        </div>

                        <div className={cx('featured-listings')}>
                            <h3 className={cx('featured-title')}>Tin đăng nổi bật</h3>
                            {postVip.map((item, index) => (
                                <div className={cx('listing-item')} key={item._id || index}>
                                    <div className={cx('listing-image')}>
                                        <img src={item?.images?.[0]} alt="Phòng trọ cao cấp" />
                                    </div>
                                    <div className={cx('listing-content')}>
                                        <h4 className={cx('listing-name')}>{item?.title}</h4>
                                        <div className={cx('listing-price')}>
                                            {item?.price != null
                                                ? `${Number(item.price).toLocaleString()} VNĐ/tháng`
                                                : ''}
                                        </div>
                                        <div className={cx('listing-time')}>
                                            {item?.createdAt
                                                ? dayjs(item.createdAt).format('DD/MM/YYYY')
                                                : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Drawer
                title={
                    <div className={cx('aff-drawer-title')}>
                        <FontAwesomeIcon icon={faShoppingBag} />
                        <span>Đồ dùng gợi ý</span>
                        {hasAffiliate && (
                            <span className={cx('aff-drawer-count')}>{affiliateProducts.length}</span>
                        )}
                    </div>
                }
                placement="bottom"
                height="auto"
                open={affDrawerOpen}
                onClose={() => setAffDrawerOpen(false)}
                className={cx('aff-drawer')}
                styles={{
                    body: { padding: '12px 16px 24px', maxHeight: '70vh', overflowY: 'auto' },
                    wrapper: { maxWidth: 560, margin: '0 auto' },
                }}
                destroyOnClose={false}
            >
                {hasAffiliate ? (
                    <div className={cx('aff-drawer-list')}>
                        {affiliateProducts.map((item) => (
                            <div className={cx('aff-drawer-item')} key={item._id || item.link}>
                                <div className={cx('aff-drawer-image')}>
                                    {item.image && isSafeHttpUrlClient(item.image) ? (
                                        <img
                                            src={item.image}
                                            alt={item.name || 'Sản phẩm'}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className={cx('aff-drawer-image-placeholder')}>
                                            <FontAwesomeIcon icon={faShoppingBag} />
                                        </div>
                                    )}
                                </div>
                                <div className={cx('aff-drawer-info')}>
                                    <h4 className={cx('aff-drawer-name')}>{item.name}</h4>
                                    {item.platform ? (
                                        <span className={cx('aff-drawer-platform')}>{item.platform}</span>
                                    ) : null}
                                    {item.price != null && !Number.isNaN(Number(item.price)) ? (
                                        <div className={cx('aff-drawer-price')}>
                                            {Number(item.price).toLocaleString('vi-VN')}đ
                                        </div>
                                    ) : null}
                                </div>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cx('aff-drawer-btn')}
                                >
                                    Xem sản phẩm
                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={cx('aff-drawer-empty')}>Chưa có đồ dùng gợi ý</div>
                )}
            </Drawer>
        </div>
    );
}

export default DetailPost;