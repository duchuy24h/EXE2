import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Modal, Descriptions, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import { requestGetRechargeStats } from '../../../../config/request';

function ManagerRechange() {
    const [rechargeStats, setRechargeStats] = useState({
        totalTransactions: 0,
        totalRevenue: 0,
        recentTransactions: 0,
        transactionGrowth: 0,
        recentRevenue: 0,
        revenueGrowth: 0,
    });
    const [rechargeData, setRechargeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const columns = [
        {
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount, record) => `${Number(amount ?? record.amount ?? 0).toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Phương thức',
            dataIndex: 'typePayment',
            key: 'typePayment',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span style={{ color: status === 'success' ? '#52c41a' : '#ff4d4f' }}>
                    {status === 'success' ? 'Thành công' : 'Thất bại'}
                </span>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
        },
    ];

    const fetchRechargeData = async () => {
        try {
            setLoading(true);
            const response = await requestGetRechargeStats();
            const { metadata } = response;

            setRechargeStats({
                totalTransactions: metadata.totalTransactions,
                totalRevenue: metadata.totalRevenue,
                recentTransactions: metadata.recentTransactions,
                transactionGrowth: metadata.transactionGrowth,
                recentRevenue: metadata.recentRevenue,
                revenueGrowth: metadata.revenueGrowth,
            });

            setRechargeData(metadata.transactions);
        } catch (error) {
            console.error('Error fetching recharge data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRechargeData();
    }, []);

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Card>
                            <Statistic
                                title="Tổng số giao dịch"
                                value={rechargeStats.totalTransactions}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card>
                            <Statistic
                                title="Tổng doanh thu"
                                value={rechargeStats.totalRevenue}
                                loading={loading}
                                formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title="Danh sách giao dịch gần đây">
                    <Table
                        columns={columns}
                        dataSource={rechargeData}
                        onRow={(record) => ({ onClick: () => setSelectedTransaction(record), style: { cursor: 'pointer' } })}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </Space>
            <Modal
                title="Chi tiết giao dịch"
                open={Boolean(selectedTransaction)}
                footer={null}
                onCancel={() => setSelectedTransaction(null)}
            >
                {selectedTransaction && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Người dùng">{selectedTransaction.username}</Descriptions.Item>
                        <Descriptions.Item label="Số tiền">{Number(selectedTransaction.amount ?? selectedTransaction.amountVND ?? 0).toLocaleString('vi-VN')} VNĐ</Descriptions.Item>
                        <Descriptions.Item label="Phương thức">{selectedTransaction.typePayment}</Descriptions.Item>
                        <Descriptions.Item label="Mã nội dung">{selectedTransaction.transferCode || 'Chưa có'}</Descriptions.Item>
                        <Descriptions.Item label="Mã giao dịch ngân hàng">{selectedTransaction.transactionId || 'Chưa xác nhận'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái"><Tag color={selectedTransaction.status === 'success' ? 'green' : 'orange'}>{selectedTransaction.status}</Tag></Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{moment(selectedTransaction.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}

export default ManagerRechange;
