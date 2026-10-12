import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, message, Popconfirm, Select, Space } from 'antd';
import {
    requestCreateMarketplaceAffiliateProduct,
    requestDeleteMarketplaceAffiliateProduct,
    requestGetMyMarketplaceAffiliateProducts,
    requestUpdateMarketplaceAffiliateProduct,
} from '../../../../config/request';
import imgDefault from '../../../../assets/images/img_default.svg';

const platforms = ['Shopee', 'Lazada', 'TikTok Shop', 'Tiki', 'Khác'];
const categories = [
    { value: 'noi-that', label: 'Nội thất' },
    { value: 'dien-may', label: 'Điện máy' },
    { value: 'gia-dung', label: 'Gia dụng' },
    { value: 'decor', label: 'Trang trí & decor' },
    { value: 'khac', label: 'Khác' },
];

function AffiliateManager() {
    const [form] = Form.useForm();
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await requestGetMyMarketplaceAffiliateProducts();
            setProducts(Array.isArray(res.metadata) ? res.metadata : []);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể tải sản phẩm affiliate');
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const resetForm = () => {
        form.resetFields();
        setEditingProduct(null);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const payload = {
                name: values.name,
                image: values.image.trim(),
                link: values.link,
                platform: values.platform,
                category: values.category,
                description: values.description || '',
                price: values.price ?? null,
            };
            if (editingProduct) {
                await requestUpdateMarketplaceAffiliateProduct(editingProduct._id, payload);
                message.success('Đã cập nhật sản phẩm affiliate');
            } else {
                await requestCreateMarketplaceAffiliateProduct(payload);
                message.success('Đã đăng sản phẩm affiliate');
            }
            resetForm();
            await fetchProducts();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể lưu sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        form.setFieldsValue({
            name: product.name,
            image: product.image,
            link: product.link,
            platform: product.platform,
            category: product.category || 'khac',
            description: product.description || '',
            price: product.price,
        });
    };

    const handleDelete = async (productId) => {
        try {
            await requestDeleteMarketplaceAffiliateProduct(productId);
            message.success('Đã xóa sản phẩm');
            await fetchProducts();
            if (editingProduct?._id === productId) resetForm();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể xóa sản phẩm');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(0, 1.2fr)', gap: 20 }}>
            <Card title={editingProduct ? 'Sửa sản phẩm Affiliate' : 'Đăng sản phẩm Affiliate'}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}>
                        <Input maxLength={200} placeholder="Ví dụ: Kệ sách mini" />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="Địa chỉ ảnh sản phẩm"
                        extra="Dùng URL ảnh công khai có thể truy cập từ internet; không dùng đường dẫn file hoặc localhost."
                        rules={[
                            { required: true, message: 'Nhập địa chỉ ảnh sản phẩm' },
                            { type: 'url', message: 'Địa chỉ ảnh phải là URL http/https hợp lệ' },
                            {
                                validator: (_, value) => {
                                    if (!value || /^https?:\/\//i.test(value.trim())) return Promise.resolve();
                                    return Promise.reject(new Error('Địa chỉ ảnh phải bắt đầu bằng http:// hoặc https://'));
                                },
                            },
                        ]}
                    >
                        <Input placeholder="https://example.com/images/product.jpg" />
                    </Form.Item>
                    <Form.Item shouldUpdate={(previous, current) => previous.image !== current.image} noStyle>
                        {({ getFieldValue }) => {
                            const image = getFieldValue('image');
                            return image && /^https?:\/\//i.test(image) ? (
                                <img
                                    src={image}
                                    alt="Xem trước ảnh sản phẩm"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = imgDefault;
                                    }}
                                    style={{ display: 'block', width: 160, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
                                />
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item name="link" label="Link Affiliate" rules={[{ required: true, message: 'Nhập link sản phẩm' }, { type: 'url', message: 'Link phải là URL http/https hợp lệ' }]}>
                        <Input placeholder="https://shopee.vn/..." />
                    </Form.Item>
                    <Form.Item name="platform" label="Nền tảng bán" rules={[{ required: true, message: 'Chọn nền tảng' }]}>
                        <Select placeholder="Chọn sàn thương mại điện tử" options={platforms.map((value) => ({ value, label: value }))} />
                    </Form.Item>
                    <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]} initialValue="khac">
                        <Select options={categories} />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả sản phẩm">
                        <Input.TextArea rows={3} maxLength={500} showCount placeholder="Mô tả ngắn về công dụng, kích thước hoặc lý do bạn gợi ý sản phẩm này..." />
                    </Form.Item>
                    <Form.Item name="price" label="Giá tham khảo (không bắt buộc)">
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="VNĐ" />
                    </Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingProduct ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
                        </Button>
                        {editingProduct && <Button onClick={resetForm}>Hủy sửa</Button>}
                    </Space>
                </Form>
            </Card>

            <Card title={`Sản phẩm đã đăng (${products.length})`}>
                <div style={{ display: 'grid', gap: 12 }}>
                    {products.map((product) => (
                        <Card key={product._id} size="small">
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                <img
                                    src={product.image || imgDefault}
                                    alt={product.name}
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = imgDefault;
                                    }}
                                    style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{product.name}</strong>
                                    <div>{product.platform}{product.price != null ? ` · ${Number(product.price).toLocaleString('vi-VN')}đ` : ''}</div>
                                    <div>{categories.find((item) => item.value === product.category)?.label || 'Khác'}</div>
                                    <a href={product.link} target="_blank" rel="noopener noreferrer">{product.link}</a>
                                </div>
                                <Space>
                                    <Button onClick={() => handleEdit(product)}>Sửa</Button>
                                    <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(product._id)} okText="Xóa" cancelText="Hủy">
                                        <Button danger>Xóa</Button>
                                    </Popconfirm>
                                </Space>
                            </div>
                        </Card>
                    ))}
                    {!products.length && <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>Bạn chưa đăng sản phẩm nào.</div>}
                </div>
            </Card>
        </div>
    );
}

export default AffiliateManager;
