import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, List, message, Row, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { requestCreatePassRoom, requestGetPassRooms, requestUploadImages } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';

const { Option } = Select;

const normFile = (e) => (Array.isArray(e) ? e : e && e.fileList);

function PassRoomManager() {
    const [form] = Form.useForm();
    const { dataUser } = useStore();
    const [items, setItems] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = async () => {
        try {
            const res = await requestGetPassRooms();
            const myItems = (res.metadata || []).filter((item) => item.userId === dataUser?._id);
            setItems(myItems);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể tải danh sách pass đồ');
        }
    };

    useEffect(() => {
        if (dataUser?._id) {
            fetchItems();
        }
    }, [dataUser?._id]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();
            fileList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append('images', file.originFileObj);
                }
            });

            const uploaded = fileList.length ? await requestUploadImages(formData) : { images: [] };
            const payload = {
                title: values.title,
                category: values.category,
                location: values.location,
                price: Number(values.price),
                area: Number(values.area),
                description: values.description,
                images: uploaded.images || [],
                phone: values.phone,
                kind: values.kind,
                decorStyle: values.decorStyle || 'modern',
            };

            await requestCreatePassRoom(payload);
            message.success('Đăng gói thành công');
            form.resetFields();
            setFileList([]);
            fetchItems();
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
                <Card title="Đăng gói Pass đồ / Affiliate decor" bordered>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                            <Input placeholder="Ví dụ: Pass đồ trọ đẹp gần trường" />
                        </Form.Item>
                        <Form.Item name="kind" label="Loại gói" initialValue="pass-room" rules={[{ required: true }]}>
                            <Select>
                                <Option value="pass-room">Pass đồ trọ</Option>
                                <Option value="affiliate-decor">Affiliate decor</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="category" label="Phân loại" initialValue="phong-tro" rules={[{ required: true }]}>
                            <Select>
                                <Option value="phong-tro">Phòng trọ</Option>
                                <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                                <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                                <Option value="can-ho-mini">Căn hộ mini</Option>
                            </Select>
                        </Form.Item>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="area" label="Diện tích" rules={[{ required: true, message: 'Nhập diện tích' }]}>
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="location" label="Địa điểm" rules={[{ required: true, message: 'Nhập địa điểm' }]}>
                            <Input placeholder="Quận 7, TP.HCM" />
                        </Form.Item>
                        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                            <Input placeholder="090xxxxxxx" />
                        </Form.Item>
                        <Form.Item name="decorStyle" label="Phong cách decor" initialValue="modern">
                            <Select>
                                <Option value="modern">Modern</Option>
                                <Option value="minimal">Minimal</Option>
                                <Option value="scandinavian">Scandinavian</Option>
                                <Option value="industrial">Industrial</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả' }]}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item name="images" valuePropName="fileList" getValueFromEvent={normFile}>
                            <Upload listType="picture-card" multiple beforeUpload={() => false} fileList={fileList} onChange={({ fileList: nextList }) => setFileList(nextList)} accept="image/*">
                                {fileList.length >= 8 ? null : (
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>Tải ảnh</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Đăng gói
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
                                            {item.kind === 'affiliate-decor' ? 'Affiliate decor' : 'Pass đồ trọ'} • {item.location}
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
