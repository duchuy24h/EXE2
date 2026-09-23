import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './PassRoomPage.module.scss';
import { requestGetPassRooms } from '../../config/request';
import imgDefault from '../../assets/images/img_default.svg';

const cx = classNames.bind(styles);

function getFirstImage(item) {
    if (!item || !Array.isArray(item.images)) {
        return imgDefault;
    }

    const first = item.images.find(
        (url) => typeof url === 'string' && url.trim()
    );

    return first || imgDefault;
}

function handleImgError(e) {
    if (e?.currentTarget) {
        e.currentTarget.onerror = null;
        e.currentTarget.src = imgDefault;
    }
}

const initialFilters = {
    kind: '',
    category: '',
    location: '',
    decorStyle: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
};

function PassRoomPage() {
    const [items, setItems] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Pass đồ trọ & Affiliate decor';

        fetchPassRooms();
    }, []);

    const fetchPassRooms = async (params = {}) => {
        setLoading(true);
        setItems([]);
        setError('');

        try {
            const res = await requestGetPassRooms(params);

            setItems(
                Array.isArray(res?.metadata)
                    ? res.metadata
                    : []
            );
        } catch (error) {
            console.error(error);

            setItems([]);

            setError(
                error?.response?.data?.message ||
                'Không thể tải danh sách pass room.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFilter = async (e) => {
        e.preventDefault();

        const params = Object.entries(filters)
            .filter(
                ([, value]) =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ''
            )
            .reduce((acc, [key, value]) => {
                acc[key] = String(value).trim();
                return acc;
            }, {});

        await fetchPassRooms(params);
    };

    const handleReset = async () => {
        setFilters(initialFilters);

        await fetchPassRooms({});
    };

    const hasActiveFilter = Object.values(filters).some(
        (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
    );

    return (
        <div className={cx('wrapper')}>
            {/* Hero */}
            <div className={cx('hero')}>
                <div className={cx('heroContent')}>
                    <span className={cx('eyebrow')}>
                        Dịch vụ nâng cấp
                    </span>

                    <h1>
                        Pass đồ trọ & Affiliate decor
                    </h1>

                    <p>
                        Gói bài nổi bật, phong cách sống đẹp,
                        decor chuẩn khu vực và pass đồ trọ giúp
                        chủ nhà tiếp cận khách hàng đúng nhu cầu.
                    </p>
                </div>

                <div className={cx('heroStats')}>
                    <div>
                        <strong>{items.length}</strong>
                        <span>Gói đang mở</span>
                    </div>

                    <div>
                        <strong>
                            {
                                items.filter(
                                    (item) =>
                                        item.kind ===
                                        'affiliate-decor'
                                ).length
                            }
                        </strong>

                        <span>Affiliate decor</span>
                    </div>

                    <div>
                        <strong>
                            {
                                items.filter(
                                    (item) =>
                                        item.kind ===
                                        'pass-room'
                                ).length
                            }
                        </strong>

                        <span>Pass đồ trọ</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <form
                className={cx('filterPanel')}
                onSubmit={handleFilter}
            >
                <div className={cx('filterHeader')}>
                    <div>
                        <h2>Bộ lọc</h2>
                        <p>
                            Chọn điều kiện rồi bấm "Lọc" để
                            tìm kiếm.
                        </p>
                    </div>
                </div>

                <div className={cx('filterGrid')}>
                    {/* Kind */}
                    <div className={cx('field')}>
                        <label htmlFor="kind">
                            Loại
                        </label>

                        <select
                            id="kind"
                            name="kind"
                            value={filters.kind}
                            onChange={handleChange}
                        >
                            <option value="">
                                Tất cả
                            </option>

                            <option value="pass-room">
                                Pass đồ trọ
                            </option>

                            <option value="affiliate-decor">
                                Affiliate decor
                            </option>
                        </select>
                    </div>

                    {/* Category */}
                    <div className={cx('field')}>
                        <label htmlFor="category">
                            Category
                        </label>

                        <select
                            id="category"
                            name="category"
                            value={filters.category}
                            onChange={handleChange}
                        >
                            <option value="">
                                Tất cả category
                            </option>

                            <option value="phong-tro">
                                Phòng trọ
                            </option>

                            <option value="nha-nguyen-can">
                                Nhà nguyên căn
                            </option>

                            <option value="can-ho">
                                Căn hộ
                            </option>

                            <option value="studio">
                                Studio
                            </option>

                            <option value="khac">
                                Khác
                            </option>
                        </select>
                    </div>

                    {/* Location */}
                    <div className={cx('field')}>
                        <label htmlFor="location">
                            Khu vực
                        </label>

                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={filters.location}
                            onChange={handleChange}
                            placeholder="VD: Hải Phòng"
                        />
                    </div>

                    {/* Decor Style */}
                    <div className={cx('field')}>
                        <label htmlFor="decorStyle">
                            Phong cách
                        </label>

                        <select
                            id="decorStyle"
                            name="decorStyle"
                            value={filters.decorStyle}
                            onChange={handleChange}
                        >
                            <option value="">
                                Tất cả phong cách
                            </option>

                            <option value="modern">
                                Modern
                            </option>

                            <option value="minimalist">
                                Minimalist
                            </option>

                            <option value="scandinavian">
                                Scandinavian
                            </option>

                            <option value="vintage">
                                Vintage
                            </option>

                            <option value="industrial">
                                Industrial
                            </option>
                        </select>
                    </div>

                    {/* Min Price */}
                    <div className={cx('field')}>
                        <label htmlFor="minPrice">
                            Giá từ
                        </label>

                        <input
                            id="minPrice"
                            name="minPrice"
                            type="number"
                            min="0"
                            value={filters.minPrice}
                            onChange={handleChange}
                            placeholder="VD: 2000000"
                        />
                    </div>

                    {/* Max Price */}
                    <div className={cx('field')}>
                        <label htmlFor="maxPrice">
                            Giá đến
                        </label>

                        <input
                            id="maxPrice"
                            name="maxPrice"
                            type="number"
                            min="0"
                            value={filters.maxPrice}
                            onChange={handleChange}
                            placeholder="VD: 4000000"
                        />
                    </div>

                    {/* Min Area */}
                    <div className={cx('field')}>
                        <label htmlFor="minArea">
                            Diện tích từ
                        </label>

                        <input
                            id="minArea"
                            name="minArea"
                            type="number"
                            min="0"
                            value={filters.minArea}
                            onChange={handleChange}
                            placeholder="VD: 20"
                        />
                    </div>

                    {/* Max Area */}
                    <div className={cx('field')}>
                        <label htmlFor="maxArea">
                            Diện tích đến
                        </label>

                        <input
                            id="maxArea"
                            name="maxArea"
                            type="number"
                            min="0"
                            value={filters.maxArea}
                            onChange={handleChange}
                            placeholder="VD: 50"
                        />
                    </div>
                </div>

                <div className={cx('filterActions')}>
                    <button
                        type="submit"
                        className={cx('filterButton')}
                        disabled={loading}
                    >
                        {loading ? 'Đang lọc...' : 'Lọc'}
                    </button>

                    <button
                        type="button"
                        className={cx('resetButton')}
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </form>

            {/* Error */}
            {error && !loading && (
                <div className={cx('errorState')}>
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className={cx('loading')}>
                    <div className={cx('loadingSpinner')} />
                    <span>Đang tải...</span>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && items.length === 0 && (
                <div className={cx('emptyState')}>
                    <div className={cx('emptyIcon')}>
                        🔍
                    </div>

                    <h3>
                        Không tìm thấy phòng phù hợp.
                    </h3>

                    <p>
                        Thử thay đổi điều kiện tìm kiếm hoặc
                        xóa bộ lọc để xem tất cả.
                    </p>

                    {hasActiveFilter && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className={cx('emptyResetButton')}
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* Result */}
            {!loading && !error && items.length > 0 && (
                <div className={cx('grid')}>
                    {items.map((item) => (
                        <Link
                            to={`/pass-room/${item._id}`}
                            className={cx('card')}
                            key={item._id}
                        >
                            <div className={cx('imageWrap')}>
                                <img
                                    src={getFirstImage(item)}
                                    alt={
                                        item.title ||
                                        'Pass room'
                                    }
                                    onError={handleImgError}
                                />

                                <span
                                    className={cx(
                                        item.kind ===
                                            'affiliate-decor'
                                            ? 'tagDecor'
                                            : 'tagPass'
                                    )}
                                >
                                    {item.kind ===
                                        'affiliate-decor'
                                        ? 'Affiliate decor'
                                        : 'Pass đồ trọ'}
                                </span>
                            </div>

                            <div className={cx('content')}>
                                <h3>
                                    {item.title}
                                </h3>

                                <p>
                                    {item.location}
                                </p>

                                <div className={cx('meta')}>
                                    <strong>
                                        {Number(
                                            item.price || 0
                                        ).toLocaleString(
                                            'vi-VN'
                                        )}{' '}
                                        VNĐ
                                    </strong>

                                    <span>
                                        {item.area} m²
                                    </span>
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