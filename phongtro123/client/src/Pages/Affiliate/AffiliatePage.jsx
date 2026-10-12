import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, message } from 'antd';
import { ArrowRightOutlined, SearchOutlined, ShopOutlined, ShoppingOutlined, SafetyOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import styles from './AffiliatePage.module.scss';
import { requestGetMarketplaceAffiliateProducts } from '../../config/request';
import imgDefault from '../../assets/images/img_default.svg';

const cx = classNames.bind(styles);

const categories = [
    { value: 'all', label: 'Tất cả sản phẩm' },
    { value: 'noi-that', label: 'Nội thất' },
    { value: 'dien-may', label: 'Điện máy' },
    { value: 'gia-dung', label: 'Đồ gia dụng' },
    { value: 'decor', label: 'Trang trí & decor' },
    { value: 'khac', label: 'Khác' },
];

const categoryNames = Object.fromEntries(categories.filter(({ value }) => value !== 'all').map(({ value, label }) => [value, label]));

function AffiliatePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [platform, setPlatform] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        document.title = 'Góc mua sắm - HomieHub';
        requestGetMarketplaceAffiliateProducts()
            .then((res) => setProducts(Array.isArray(res.metadata) ? res.metadata : []))
            .catch((error) => message.error(error?.response?.data?.message || 'Không thể tải sản phẩm affiliate'))
            .finally(() => setLoading(false));
    }, []);

    const platformOptions = useMemo(
        () => [...new Set(products.map((product) => product.platform).filter(Boolean))]
            .sort((first, second) => first.localeCompare(second, 'vi')),
        [products],
    );

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('vi');
        const result = products.filter((product) => {
            const matchesSearch = !normalizedSearch
                || [product.name, product.description, product.platform, categoryNames[product.category]]
                    .some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch));
            return matchesSearch
                && (category === 'all' || product.category === category)
                && (platform === 'all' || product.platform === platform);
        });

        return result.sort((first, second) => {
            if (sortBy === 'price-low') return Number(first.price ?? Infinity) - Number(second.price ?? Infinity);
            if (sortBy === 'price-high') return Number(second.price ?? -1) - Number(first.price ?? -1);
            return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
        });
    }, [products, search, category, platform, sortBy]);

    const categoryCounts = useMemo(
        () => products.reduce((counts, product) => {
            counts[product.category || 'khac'] = (counts[product.category || 'khac'] || 0) + 1;
            return counts;
        }, {}),
        [products],
    );

    return (
        <main className={cx('page')}>
            <section className={cx('hero')}>
                <div className={cx('heroCopy')}>
                    <span className={cx('eyebrow')}>
                        <ShoppingOutlined /> Góc mua sắm HomieHub
                    </span>
                    <h1>Chọn món hay,<br /><span>cho căn phòng đẹp hơn.</span></h1>
                    <p>
                        Khám phá những món đồ hữu ích do cộng đồng HomieHub tuyển chọn.
                        Xem thông tin rõ ràng, chọn sàn yêu thích và mua trực tiếp từ đối tác.
                    </p>
                    <div className={cx('heroActions')}>
                        <a href="#products" className={cx('primaryLink')}>
                            Khám phá sản phẩm <ArrowRightOutlined />
                        </a>
                        <Link to="/trang-ca-nhan" className={cx('secondaryLink')}>Chia sẻ sản phẩm</Link>
                    </div>
                    <div className={cx('heroTrust')}>
                        <span><SafetyOutlined /> Link mở trực tiếp trên sàn</span>
                        <span><ShopOutlined /> Shopee, Lazada, TikTok Shop...</span>
                    </div>
                </div>
                <div className={cx('heroVisual')} aria-hidden="true">
                    <div className={cx('heroOrb')} />
                    <div className={cx('heroProduct', 'heroProductBack')}>
                        <span>GÓC NHÀ XINH</span>
                        <strong>Đồ hay<br />mỗi ngày</strong>
                    </div>
                    <div className={cx('heroProduct', 'heroProductFront')}>
                        <span className={cx('heroSparkle')}>✦</span>
                        <ShoppingOutlined />
                        <strong>Find your<br />favorite</strong>
                        <span className={cx('heroProductFooter')}>HOMIEHUB SELECT</span>
                    </div>
                    <span className={cx('heroBubble', 'bubbleTop')}>được cộng đồng gợi ý</span>
                    <span className={cx('heroBubble', 'bubbleBottom')}>mua sắm tiện lợi</span>
                </div>
                <div className={cx('heroStats')}>
                    <div><strong>{products.length}</strong><span>sản phẩm được chia sẻ</span></div>
                    <div><strong>{platformOptions.length}</strong><span>nền tảng mua sắm</span></div>
                    <div><strong>{Object.keys(categoryCounts).length}</strong><span>nhóm sản phẩm</span></div>
                </div>
            </section>

            <section className={cx('shoppingSection')} id="products">
                <div className={cx('sectionHeading')}>
                    <div>
                        <span className={cx('sectionEyebrow')}>CỘNG ĐỒNG HOMIEHUB GỢI Ý</span>
                        <h2>Tìm món đồ bạn cần</h2>
                        <p>Sản phẩm có link mua hàng và nền tảng bán được ghi rõ.</p>
                    </div>
                    <div className={cx('resultCount')}>{filteredProducts.length} sản phẩm</div>
                </div>

                <div className={cx('categoryBar')}>
                    {categories.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            className={cx('categoryChip', { categoryActive: category === item.value })}
                            onClick={() => setCategory(item.value)}
                        >
                            {item.label}
                            {item.value !== 'all' && categoryCounts[item.value] > 0 && (
                                <span>{categoryCounts[item.value]}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={cx('toolbar')}>
                    <Input
                        allowClear
                        size="large"
                        className={cx('searchInput')}
                        prefix={<SearchOutlined />}
                        placeholder="Tìm tên sản phẩm, nền tảng..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Select
                        size="large"
                        value={platform}
                        onChange={setPlatform}
                        className={cx('toolbarSelect')}
                        options={[
                            { value: 'all', label: 'Tất cả nền tảng' },
                            ...platformOptions.map((value) => ({ value, label: value })),
                        ]}
                    />
                    <Select
                        size="large"
                        value={sortBy}
                        onChange={setSortBy}
                        className={cx('toolbarSelect', 'sortSelect')}
                        options={[
                            { value: 'newest', label: 'Mới nhất' },
                            { value: 'price-low', label: 'Giá: thấp đến cao' },
                            { value: 'price-high', label: 'Giá: cao đến thấp' },
                        ]}
                    />
                </div>

                {loading ? (
                    <div className={cx('grid')}>
                        {Array.from({ length: 8 }, (_, index) => (
                            <div className={cx('skeletonCard')} key={index}>
                                <div className={cx('skeletonImage')} />
                                <div className={cx('skeletonLine')} />
                                <div className={cx('skeletonLine', 'shortLine')} />
                                <div className={cx('skeletonButton')} />
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length ? (
                    <div className={cx('grid')}>
                        {filteredProducts.map((product) => (
                            <article className={cx('productCard')} key={product._id}>
                                <a
                                    className={cx('productImage')}
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Xem ${product.name} trên ${product.platform}`}
                                >
                                    <img
                                        src={product.image || imgDefault}
                                        alt={product.name}
                                        loading="lazy"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = imgDefault;
                                        }}
                                    />
                                    <span className={cx('platformTag')}><ShopOutlined /> {product.platform}</span>
                                    <span className={cx('imageAction')}>Xem sản phẩm <ArrowRightOutlined /></span>
                                </a>
                                <div className={cx('productInfo')}>
                                    <div className={cx('productCategory')}>{categoryNames[product.category] || 'Sản phẩm gợi ý'}</div>
                                    <h3>{product.name}</h3>
                                    {product.description && <p className={cx('description')}>{product.description}</p>}
                                    <div className={cx('productMeta')}>
                                        {product.price != null ? (
                                            <strong className={cx('price')}>{Number(product.price).toLocaleString('vi-VN')}đ</strong>
                                        ) : <span className={cx('priceHint')}>Xem giá mới nhất tại sàn</span>}
                                        <span className={cx('date')}>{dayjs(product.createdAt).format('DD/MM/YYYY')}</span>
                                    </div>
                                    <div className={cx('productFooter')}>
                                        <div className={cx('seller')}>
                                            <span className={cx('sellerAvatar')}>
                                                {product.seller?.avatar ? (
                                                    <img src={product.seller.avatar} alt="" />
                                                ) : <span>{(product.seller?.fullName || 'H').charAt(0).toUpperCase()}</span>}
                                            </span>
                                            <span title={product.seller?.fullName || 'Cộng đồng HomieHub'}>
                                                {product.seller?.fullName || 'Cộng đồng HomieHub'}
                                            </span>
                                        </div>
                                        <Button
                                            type="primary"
                                            href={product.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cx('buyButton')}
                                        >
                                            Mua tại {product.platform}
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className={cx('emptyState')}>
                        <span className={cx('emptyIcon')}><SearchOutlined /></span>
                        <h3>{products.length ? 'Chưa tìm thấy sản phẩm phù hợp' : 'Góc mua sắm đang chờ sản phẩm đầu tiên'}</h3>
                        <p>
                            {products.length
                                ? 'Thử đổi từ khóa hoặc bộ lọc để xem thêm sản phẩm.'
                                : 'Chia sẻ sản phẩm bạn yêu thích để mọi người cùng khám phá.'}
                        </p>
                        {products.length ? (
                            <Button onClick={() => { setSearch(''); setCategory('all'); setPlatform('all'); }}>
                                Xóa bộ lọc
                            </Button>
                        ) : (
                            <Link to="/trang-ca-nhan" className={cx('primaryLink')}>Đăng sản phẩm đầu tiên <ArrowRightOutlined /></Link>
                        )}
                    </div>
                )}
            </section>
            <footer className={cx('disclosure')}>
                <SafetyOutlined />
                <span>
                    Sản phẩm được chia sẻ bởi cộng đồng. Khi chọn mua, bạn sẽ được chuyển đến website/app của nền tảng bán hàng.
                    Một số liên kết có thể là liên kết affiliate.
                </span>
            </footer>
        </main>
    );
}

export default AffiliatePage;
