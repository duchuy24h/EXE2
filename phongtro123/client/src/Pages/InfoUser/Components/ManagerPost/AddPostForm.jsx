import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    message,
    Row,
    Col,
    Checkbox,
    Divider,
    Typography,
    AutoComplete,
    Table,
    Statistic,
    Space,
    Modal,
    Card,
    Empty,
} from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { requestCreatePost } from '../../../../config/request';

const { Option } = Select;
const { Title, Text } = Typography;

import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

const dataSource = [
    {
        key: '1',
        typeNews: 'Tin VIP',
        '3 ngày': 50,
        '7 ngày': 315,
        '30 ngày': 1200,
    },
    {
        key: '2',
        typeNews: 'Tin thường',
        '3 ngày': 10,
        '7 ngày': 50,
        '30 ngày': 1000,
    },
];

const columns = [
    {
        title: 'Loại Tin',
        dataIndex: 'typeNews',
        key: 'typeNews',
    },
    {
        title: '3 ngày',
        dataIndex: '3 ngày',
        key: '3 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} Coin` : price),
    },
    {
        title: '7 ngày',
        dataIndex: '7 ngày',
        key: '7 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} Coin` : price),
    },
    {
        title: '30 ngày',
        dataIndex: '30 ngày',
        key: '30 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} Coin` : price),
    },
];

const optionLabels = [
    'Đầy đủ nội thất',
    'Có gác',
    'Có kệ bếp',
    'Có máy lạnh',
    'Có máy giặt',
    'Có tủ lạnh',
    'Có thang máy',
    'Không chung chủ',
    'Giờ giấc tự do',
    'Có bảo vệ 24/24',
    'Có hầm để xe',
];

const durationOptions = [
    { label: '3 ngày', value: 3 },
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
];

const isValidHttpUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        return true;
    } catch {
        return false;
    }
};

const isValidImageUrl = (url) => {
    return isValidHttpUrl(url);
};

function AddPostForm({ onFinish, onCancel, initialValues }) {
    const [form] = Form.useForm();
    const [imageUrls, setImageUrls] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [urlInputError, setUrlInputError] = useState('');
    const [description, setDescription] = useState(initialValues?.description || '');
    const [valueSearch, setValueSearch] = useState('');
    const [dataSearch, setDataSearch] = useState([]);
    const debouncedSearch = useDebounce(valueSearch, 500);
    const [mapQuery, setMapQuery] = useState(initialValues?.address || 'Lăng Chủ tịch Hồ Chí Minh');
    const [dateEnd, setDateEnd] = useState(null);

    const [estimatedCost, setEstimatedCost] = useState(0);

    // AFF products state
    const [affiliateProducts, setAffiliateProducts] = useState([]);
    const [affModalOpen, setAffModalOpen] = useState(false);
    const [editingAffIndex, setEditingAffIndex] = useState(null);
    const [affForm] = Form.useForm();

    const selectedDuration = Form.useWatch('duration', form);
    const selectedTypeNews = Form.useWatch('typeNews', form);

    useEffect(() => {
        let calculatedCost = 0;
        if (selectedDuration && selectedTypeNews) {
            const selectedTier = dataSource.find((item) => {
                const itemTypeKey = item.typeNews === 'Tin VIP' ? 'vip' : 'normal';
                return itemTypeKey === selectedTypeNews;
            });

            if (selectedTier) {
                const durationKey = `${selectedDuration} ngày`;
                setDateEnd(selectedDuration);
                calculatedCost = selectedTier[durationKey] || 0;
            }
        }
        setEstimatedCost(calculatedCost);
    }, [selectedDuration, selectedTypeNews]);

    useEffect(() => {
        const fetchData = async () => {
            if (debouncedSearch) {
                const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
                    params: {
                        input: debouncedSearch,
                        api_key: import.meta.env.VITE_API_KEY,
                    },
                });
                setDataSearch(res.data.predictions);
            }
        };
        fetchData();
    }, [debouncedSearch]);

    useEffect(() => {
        if (initialValues) {
            const initialData = {
                ...initialValues,
                location: initialValues.address || initialValues.location,
                options: Array.isArray(initialValues.options) ? initialValues.options : [],
            };
            form.setFieldsValue(initialData);
            if (initialValues.description) {
                setDescription(initialValues.description);
            }
            setMapQuery(initialValues.address || initialValues.location || 'Lăng Chủ tịch Hồ Chí Minh');

            if (initialValues.images && Array.isArray(initialValues.images)) {
                setImageUrls(
                    initialValues.images
                        .filter((img) => typeof img === 'string' && img.trim())
                        .map((img, index) => ({
                            id: `init-${index}-${Date.now()}`,
                            url: img.trim(),
                            error: !isValidImageUrl(img) ? 'URL không hợp lệ' : '',
                            loadError: false,
                        })),
                );
            } else {
                setImageUrls([]);
            }

            if (Array.isArray(initialValues.affiliateProducts)) {
                setAffiliateProducts(
                    initialValues.affiliateProducts.map((item, index) => ({
                        localId: item._id || `aff-init-${index}-${Date.now()}`,
                        name: item.name || '',
                        image: item.image || '',
                        price: item.price != null ? item.price : null,
                        link: item.link || '',
                        platform: item.platform || '',
                    })),
                );
            } else {
                setAffiliateProducts([]);
            }
        } else {
            form.resetFields();
            setImageUrls([]);
            setUrlInput('');
            setUrlInputError('');
            setDescription('');
            setMapQuery('Lăng Chủ tịch Hồ Chí Minh');
            setEstimatedCost(0);
            setAffiliateProducts([]);
        }
    }, [initialValues, form]);

    const handleAddImageUrl = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) {
            setUrlInputError('Vui lòng nhập URL ảnh');
            return;
        }
        if (!isValidImageUrl(trimmed)) {
            setUrlInputError('URL không hợp lệ. Chỉ chấp nhận http:// hoặc https://');
            return;
        }
        if (imageUrls.some((item) => item.url === trimmed)) {
            setUrlInputError('URL này đã được thêm');
            return;
        }
        if (imageUrls.length >= 8) {
            setUrlInputError('Tối đa 8 ảnh');
            return;
        }

        setImageUrls((prev) => [
            ...prev,
            {
                id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                url: trimmed,
                error: '',
                loadError: false,
            },
        ]);
        setUrlInput('');
        setUrlInputError('');
    };

    const handleRemoveImageUrl = (id) => {
        setImageUrls((prev) => prev.filter((item) => item.id !== id));
    };

    const handleImageLoadError = (id) => {
        setImageUrls((prev) =>
            prev.map((item) => (item.id === id ? { ...item, loadError: true } : item)),
        );
    };

    const handleImageLoadSuccess = (id) => {
        setImageUrls((prev) =>
            prev.map((item) => (item.id === id ? { ...item, loadError: false } : item)),
        );
    };

    const openAddAffModal = () => {
        setEditingAffIndex(null);
        affForm.resetFields();
        setAffModalOpen(true);
    };

    const openEditAffModal = (index) => {
        const item = affiliateProducts[index];
        setEditingAffIndex(index);
        affForm.setFieldsValue({
            name: item.name,
            image: item.image,
            price: item.price,
            link: item.link,
            platform: item.platform,
        });
        setAffModalOpen(true);
    };

    const handleAffModalOk = async () => {
        try {
            const values = await affForm.validateFields();
            const name = (values.name || '').trim();
            const link = (values.link || '').trim();
            const image = (values.image || '').trim();
            const platform = (values.platform || '').trim();
            const price =
                values.price === null || values.price === undefined || values.price === ''
                    ? null
                    : Number(values.price);

            if (!name) {
                message.error('Vui lòng nhập tên sản phẩm');
                return;
            }
            if (!link) {
                message.error('Vui lòng nhập link mua hàng');
                return;
            }
            if (!isValidHttpUrl(link)) {
                message.error('Link mua hàng phải là URL http/https hợp lệ');
                return;
            }
            if (image && !isValidHttpUrl(image)) {
                message.error('URL ảnh sản phẩm không hợp lệ');
                return;
            }

            const product = {
                localId:
                    editingAffIndex !== null
                        ? affiliateProducts[editingAffIndex].localId
                        : `aff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                image,
                price,
                link,
                platform,
            };

            if (editingAffIndex !== null) {
                setAffiliateProducts((prev) =>
                    prev.map((item, i) => (i === editingAffIndex ? product : item)),
                );
            } else {
                setAffiliateProducts((prev) => [...prev, product]);
            }

            setAffModalOpen(false);
            affForm.resetFields();
            setEditingAffIndex(null);
        } catch {
            // validation errors from Form
        }
    };

    const handleRemoveAff = (index) => {
        setAffiliateProducts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFinish = async (values) => {
        try {
            if (imageUrls.length === 0) {
                message.error('Vui lòng thêm ít nhất 1 URL ảnh');
                return;
            }

            const invalidItems = imageUrls.filter((item) => !isValidImageUrl(item.url) || item.error);
            if (invalidItems.length > 0) {
                message.error('Có URL ảnh không hợp lệ. Vui lòng kiểm tra lại.');
                return;
            }

            for (const item of affiliateProducts) {
                if (!item.name || !item.name.trim()) {
                    message.error('Tên sản phẩm AFF không được để trống');
                    return;
                }
                if (!item.link || !isValidHttpUrl(item.link)) {
                    message.error(`Link mua hàng của "${item.name || 'sản phẩm'}" không hợp lệ`);
                    return;
                }
            }

            const images = imageUrls.map((item) => item.url.trim());

            const today = dayjs();
            const endDate = values.duration ? today.add(values.duration, 'day').utc().toISOString() : null;

            const payloadAffiliateProducts = affiliateProducts.map((item) => ({
                name: item.name.trim(),
                image: item.image ? item.image.trim() : '',
                price: item.price,
                link: item.link.trim(),
                platform: item.platform ? item.platform.trim() : '',
            }));

            const data = {
                title: values.title,
                price: values.price,
                description: description,
                category: values.category,
                area: values.area,
                phone: values.phone,
                username: values.username,
                options: values.options,
                location: values.location,
                typeNews: values.typeNews,
                endDate: endDate,
                images,
                dateEnd,
                isPassRoom: Boolean(values.isPassRoom),
                isAffiliateDecor: Boolean(values.isAffiliateDecor) || payloadAffiliateProducts.length > 0,
                affiliateProducts: payloadAffiliateProducts,
            };

            await requestCreatePost(data);
            message.success(initialValues ? 'cập nhật bài viết thành công' : 'tạo bài viết thành công');
            form.resetFields();
            setImageUrls([]);
            setUrlInput('');
            setUrlInputError('');
            setDescription('');
            setEstimatedCost(0);
            setAffiliateProducts([]);
            onFinish(data);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo/cập nhật bài viết.');
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setImageUrls([]);
        setUrlInput('');
        setUrlInputError('');
        setDescription('');
        setEstimatedCost(0);
        setAffiliateProducts([]);
        onCancel();
    };

    const handleLocationSearch = (searchText) => {
        setValueSearch(searchText);
    };

    const handleLocationSelect = (selectedValue) => {
        form.setFieldsValue({ location: selectedValue });
        setMapQuery(selectedValue);
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Title level={5}>Thông tin cơ bản</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Ví dụ: Phòng trọ giá rẻ gần DH Bách Khoa" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="price"
                        label="Giá (VNĐ/tháng)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Ví dụ: 2,500,000"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Mô tả phòng trọ" required>
                <Input.TextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Nhập mô tả phòng trọ, nội thất, vị trí và tiện ích..."
                    rows={8}
                    showCount
                    maxLength={5000}
                />
            </Form.Item>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Loại hình"
                        rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
                    >
                        <Select placeholder="Chọn loại hình">
                            <Option value="phong-tro">Phòng trọ</Option>
                            <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                            <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                            <Option value="can-ho-mini">Căn hộ mini</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="area"
                        label="Diện tích (m²)"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 25" />
                    </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin liên hệ</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="username"
                        label="Tên người đăng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đăng' }]}
                    >
                        <Input placeholder="Tên người cho thuê" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại liên hệ"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                    >
                        <Input placeholder="Số điện thoại người đăng" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="location"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn địa chỉ' }]}
            >
                <AutoComplete
                    options={dataSearch?.map((item) => ({ value: item.description }))}
                    onSearch={handleLocationSearch}
                    onSelect={handleLocationSelect}
                    placeholder="Nhập địa chỉ hoặc chọn từ gợi ý..."
                >
                    <Input />
                </AutoComplete>
            </Form.Item>

            <div>
                <h4 style={{ marginBottom: 16 }}>Vị trí & bản đồ</h4>
                <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                />
            </div>

            <Divider />

            <Title level={5}>Hình ảnh (URL)</Title>
            <div className="image-url-section" style={{ marginBottom: 24 }}>
                <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
                    <Input
                        prefix={<LinkOutlined />}
                        placeholder="Dán URL ảnh (https://...)"
                        value={urlInput}
                        onChange={(e) => {
                            setUrlInput(e.target.value);
                            setUrlInputError('');
                        }}
                        onPressEnter={(e) => {
                            e.preventDefault();
                            handleAddImageUrl();
                        }}
                        status={urlInputError ? 'error' : undefined}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddImageUrl}>
                        Thêm
                    </Button>
                </Space.Compact>
                {urlInputError && (
                    <div style={{ color: '#ff4d4f', fontSize: 13, marginBottom: 12 }}>{urlInputError}</div>
                )}
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 12 }}>
                    Nhập URL ảnh công khai (http/https). Tối đa 8 ảnh. Không upload file lên server.
                </div>

                {imageUrls.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: 12,
                        }}
                    >
                        {imageUrls.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    border: item.loadError || item.error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    background: '#fafafa',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: 110,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f0f0f0',
                                    }}
                                >
                                    {item.loadError ? (
                                        <span style={{ color: '#ff4d4f', fontSize: 12, padding: 8, textAlign: 'center' }}>
                                            Không tải được ảnh
                                        </span>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt="preview"
                                            style={{ width: '100%', height: 110, objectFit: 'cover' }}
                                            onError={() => handleImageLoadError(item.id)}
                                            onLoad={() => handleImageLoadSuccess(item.id)}
                                        />
                                    )}
                                </div>
                                <div style={{ padding: '6px 8px' }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#595959',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginBottom: 6,
                                        }}
                                        title={item.url}
                                    >
                                        {item.url}
                                    </div>
                                    {item.error && (
                                        <div style={{ color: '#ff4d4f', fontSize: 11, marginBottom: 4 }}>{item.error}</div>
                                    )}
                                    <Button
                                        type="link"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveImageUrl(item.id)}
                                        style={{ padding: 0 }}
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Divider />

            <Title level={5}>Tiện nghi & Tùy chọn</Title>
            <Form.Item name="options">
                <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        {optionLabels.map((label) => (
                            <Col xs={24} sm={12} md={8} key={label}>
                                <Checkbox value={label}>{label}</Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>
            </Form.Item>

            <Divider />

            <Title level={5}>Dịch vụ bổ sung</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                    <Form.Item name="isPassRoom" valuePropName="checked" initialValue={false}>
                        <Checkbox>Pass đồ trọ</Checkbox>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item name="isAffiliateDecor" valuePropName="checked" initialValue={false}>
                        <Checkbox>Affiliate decor</Checkbox>
                    </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>Đồ dùng gợi ý / AFF</Title>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text type="secondary">Không bắt buộc. Có thể thêm nhiều sản phẩm liên quan đến phòng.</Text>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={openAddAffModal}>
                        Thêm đồ dùng
                    </Button>
                </div>

                {affiliateProducts.length === 0 ? (
                    <Card size="small" style={{ background: '#fafafa' }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Chưa có đồ dùng gợi ý"
                        >
                            <Button type="primary" icon={<PlusOutlined />} onClick={openAddAffModal}>
                                + Thêm đồ dùng
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 12,
                        }}
                    >
                        {affiliateProducts.map((item, index) => (
                            <Card
                                key={item.localId}
                                size="small"
                                title={item.name}
                                extra={
                                    <Space size={4}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openEditAffModal(index)}
                                        />
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveAff(index)}
                                        />
                                    </Space>
                                }
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                            width: '100%',
                                            height: 100,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            marginBottom: 8,
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : null}
                                {item.price != null && (
                                    <div style={{ fontWeight: 600, color: '#e03c31', marginBottom: 4 }}>
                                        {Number(item.price).toLocaleString('vi-VN')}đ
                                    </div>
                                )}
                                {item.platform && (
                                    <div style={{ fontSize: 12, color: '#be185d', marginBottom: 4 }}>
                                        {item.platform}
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#595959',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title={item.link}
                                >
                                    {item.link}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                title={editingAffIndex !== null ? 'Sửa đồ dùng AFF' : 'Thêm đồ dùng AFF'}
                open={affModalOpen}
                onOk={handleAffModalOk}
                onCancel={() => {
                    setAffModalOpen(false);
                    affForm.resetFields();
                    setEditingAffIndex(null);
                }}
                okText={editingAffIndex !== null ? 'Cập nhật' : 'Thêm'}
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={affForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                    >
                        <Input placeholder="Ví dụ: Tủ lạnh mini" />
                    </Form.Item>
                    <Form.Item
                        name="link"
                        label="Link mua hàng"
                        rules={[
                            { required: true, message: 'Vui lòng nhập link mua hàng' },
                            {
                                validator: (_, value) => {
                                    if (!value || isValidHttpUrl(value)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('URL phải bắt đầu bằng http:// hoặc https://'));
                                },
                            },
                        ]}
                    >
                        <Input prefix={<LinkOutlined />} placeholder="https://shopee.vn/..." />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="URL ảnh sản phẩm"
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (!value || isValidHttpUrl(value)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('URL ảnh không hợp lệ'));
                                },
                            },
                        ]}
                    >
                        <Input prefix={<LinkOutlined />} placeholder="https://... (không bắt buộc)" />
                    </Form.Item>
                    <Form.Item name="price" label="Giá (VNĐ)">
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Không bắt buộc"
                        />
                    </Form.Item>
                    <Form.Item name="platform" label="Nền tảng">
                        <Input placeholder="Shopee, Lazada, Tiki... (không bắt buộc)" />
                    </Form.Item>
                </Form>
            </Modal>

            <Divider />

            <Row gutter={24} align="bottom">
                <Col xs={24} md={8}>
                    <Form.Item
                        name="typeNews"
                        label="Loại tin"
                        rules={[{ required: true, message: 'Vui lòng chọn loại tin' }]}
                    >
                        <Select placeholder="Chọn loại tin">
                            <Option value="vip">Tin VIP</Option>
                            <Option value="normal">Tin thường</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="duration"
                        label="Thời gian đăng"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian đăng' }]}
                    >
                        <Select placeholder="Chọn số ngày">
                            {durationOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8} style={{ paddingBottom: '24px' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic
                                title="Tạm tính (Coin)"
                                value={estimatedCost > 0 ? estimatedCost : '-'}
                                precision={0}
                                formatter={(value) =>
                                    typeof value === 'number' ? value.toLocaleString('vi-VN') : value
                                }
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>

            <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16 }}>Bảng giá dịch vụ</h4>
                <Table dataSource={dataSource} columns={columns} pagination={false} size="small" bordered />
            </div>

            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                    {initialValues ? 'Cập nhật bài viết' : 'Thêm bài viết'}
                </Button>
            </Form.Item>
        </Form>
    );
}

export default AddPostForm;