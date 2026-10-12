import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, List, message, Row, Select } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { requestCreatePassRoom, requestGetPassRooms } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';
import imgDefault from '../../../../assets/images/img_default.svg';

const { Option } = Select;

function PassRoomManager() {
    const [form] = Form.useForm();
    const { dataUser } = useStore();
    const kind = Form.useWatch('kind', form);
    const [items, setItems] = useState([]);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imageUrls, setImageUrls] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            const res = await requestGetPassRooms();
            const myItems = (res.metadata || []).filter((item) => item.userId === dataUser?._id);
            setItems(myItems);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể tải danh sách pass đồ');
        }
    }, [dataUser?._id]);

    useEffect(() => {
        if (dataUser?._id) {
            fetchItems();
        }
    }, [dataUser?._id, fetchItems]);

    const handleAddImageUrl = () => {
        const value = imageUrlInput.trim();
        let parsedUrl;
        try {
            parsedUrl = new URL(value);
        } catch {
            message.error('Địa chỉ ảnh phải là URL hợp lệ bắt đầu bằng http:// hoặc https://');
            return;
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            message.error('Địa chỉ ảnh phải bắt đầu bằng http:// hoặc https://');
            return;
        }
        if (imageUrls.includes(value)) {
            message.warning('Địa chỉ ảnh này đã được thêm');
            return;
        }
        if (imageUrls.length >= 6) {
            message.warning('Mỗi tin chỉ được thêm tối đa 6 ảnh');
            return;
        }
        setImageUrls((current) => [...current, value]);
        setImageUrlInput('');
    };

    const handleSubmit = async (values) => {
        if (imageUrls.length === 0) {
            message.error('Vui lòng thêm ít nhất một địa chỉ ảnh sản phẩm');
            return;
        }
        try {
            setLoading(true);
            const payload = {
                title: values.title,
                ...(values.kind === 'pass-item'
                    ? { itemCategory: values.itemCategory }
                    : { category: values.category }),
                location: values.location,
                price: Number(values.price),
                ...(values.kind !== 'pass-item' ? { area: Number(values.area) } : {}),
                description: values.description,
                images: imageUrls,
                phone: values.phone,
                kind: values.kind,
                ...(values.kind === 'affiliate-decor' ? { decorStyle: values.decorStyle || 'modern' } : {}),
            };

            await requestCreatePassRoom(payload);
            message.success(values.kind === 'pass-item' ? 'Đăng tin pass đồ thành công' : 'Đăng gói thành công');
            form.resetFields();
            setImageUrls([]);
            setImageUrlInput('');
            await fetchItems();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể đăng gói');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.price || 0), 0),
        [items],
    );

    return (
        <Row gutter={[16, 16]}>
            <Col span={24} lg={10}>
                <Card title="Đăng tin pass đồ / Pass phòng / Affiliate decor" bordered>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                            <Input placeholder="Ví dụ: Thanh lý bàn học còn mới" />
                        </Form.Item>
                        <Form.Item name="kind" label="Loại tin" initialValue="pass-room" rules={[{ required: true }]}>
                            <Select>
                                <Option value="pass-item">Đăng bán đồ đã qua sử dụng</Option>
                                <Option value="pass-room">Pass phòng trọ</Option>
                            </Select>
                        </Form.Item>
                        {kind === 'pass-item' ? (
                            <Form.Item
                                name="itemCategory"
                                label="Danh mục đồ"
                                rules={[{ required: true, message: 'Chọn danh mục đồ cần pass' }]}
                            >
                                <Select placeholder="Chọn danh mục">
                                    <Option value="noi-that">Nội thất</Option>
                                    <Option value="dien-tu">Đồ điện tử</Option>
                                    <Option value="do-gia-dung">Đồ gia dụng</Option>
                                    <Option value="do-trang-tri">Đồ trang trí</Option>
                                    <Option value="khac">Khác</Option>
                                </Select>
                            </Form.Item>
                        ) : (
                            <>
                                <Form.Item name="category" label="Phân loại phòng" initialValue="phong-tro" rules={[{ required: true }]}>
                                    <Select>
                                        <Option value="phong-tro">Phòng trọ</Option>
                                        <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                                        <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                                        <Option value="can-ho-mini">Căn hộ mini</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="area" label="Diện tích" rules={[{ required: true, message: 'Nhập diện tích' }]}>
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </>
                        )}
                        <Form.Item
                            name="price"
                            label={kind === 'pass-item' ? 'Giá bán (VNĐ)' : 'Giá'}
                            rules={[{ required: true, message: 'Nhập giá' }]}
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="location" label="Địa điểm" rules={[{ required: true, message: 'Nhập địa điểm' }]}>
                            <Input placeholder="Quận 7, TP.HCM" />
                        </Form.Item>
                        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                            <Input placeholder="090xxxxxxx" />
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả' }]}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item label="Địa chỉ ảnh (URL)" required>
                            <Input.Group compact>
                                <Input
                                    value={imageUrlInput}
                                    onChange={(event) => setImageUrlInput(event.target.value)}
                                    onPressEnter={(event) => {
                                        event.preventDefault();
                                        handleAddImageUrl();
                                    }}
                                    placeholder="https://example.com/images/item.jpg"
                                    style={{ width: 'calc(100% - 110px)' }}
                                />
                                <Button icon={<PlusOutlined />} onClick={handleAddImageUrl}>Thêm ảnh</Button>
                            </Input.Group>
                            <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>
                                Dán URL ảnh công khai trên internet (http/https), tối đa 6 ảnh. Không dùng đường dẫn file hoặc localhost.
                            </div>
                            {imageUrls.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 12 }}>
                                    {imageUrls.map((url) => (
                                        <div key={url} style={{ minWidth: 0, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                                            <img
                                                src={url}
                                                alt="Ảnh sản phẩm"
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = imgDefault;
                                                }}
                                                style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 5 }}
                                            />
                                            <div title={url} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, margin: '6px 0' }}>
                                                {url}
                                            </div>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => setImageUrls((current) => current.filter((image) => image !== url))}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            {kind === 'pass-item' ? 'Đăng tin bán đồ' : 'Đăng gói'}
                        </Button>
                    </Form>
                </Card>
            </Col>

            <Col span={24} lg={14}>
                <Card title="Danh sách gói đã đăng" bordered>
                    <div style={{ marginBottom: 12, fontWeight: 600 }}>
                        Tổng giá trị: {totalAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                    <List
                        dataSource={items}
                        locale={{ emptyText: 'Chưa có gói nào' }}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <img
                                            src={item.images?.[0] || 'https://via.placeholder.com/80'}
                                            alt={item.title}
                                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
                                        />
                                    }
                                    title={item.title}
                                    description={
                                        <span>
                                            {item.kind === 'pass-item'
                                                ? 'Pass đồ'
                                                : item.kind === 'affiliate-decor'
                                                    ? 'Affiliate decor'
                                                    : 'Pass phòng trọ'} • {item.location}
                                        </span>
                                    }
                                />
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#1f9d64' }}>
                                        {Number(item.price || 0).toLocaleString('vi-VN')} VNĐ
                                    </div>
                                    <div style={{ color: '#667085' }}>{item.status || 'active'}</div>
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
        </Row>
    );
}

export default PassRoomManager;
