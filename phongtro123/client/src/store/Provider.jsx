import Context from './Context';
import CryptoJS from 'crypto-js';

import { useEffect, useState } from 'react';
import { requestAuth, requestSearch } from '../config/request';

import useDebounce from '../hooks/useDebounce';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [dataPayment, setDataPayment] = useState(null);
    const [dataMessages, setDataMessages] = useState([]);
    // State cho các cửa sổ chat đang mở
    const [globalUsersMessage, setGlobalUsersMessage] = useState([]);

    const fetchAuth = async () => {
        const res = await requestAuth();
        const bytes = CryptoJS.AES.decrypt(res.metadata.auth, import.meta.env.VITE_SECRET_CRYPTO);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        const user = JSON.parse(originalText);
        setDataUser(user);
    };

    useEffect(() => {
        // Luôn thử xác thực: cookie 'token' (httpOnly) tự động gửi kèm nếu hợp lệ,
        // /api/auth sẽ trả 401 khi chưa đăng nhập -> bỏ qua lỗi, giữ dataUser = {}.
        // Không dùng cookie 'logged' làm điều kiện vì nó có thể không đọc được
        // khi frontend và backend nằm trên subdomain khác nhau.
        fetchAuth().catch(() => { });
    }, []);

    const [valueSearch, setValueSearch] = useState('');
    const debouncedSearch = useDebounce(valueSearch, 500);

    const [dataSearch, setDataSearch] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            const res = await requestSearch(debouncedSearch);
            setDataSearch(res.metadata);
        };
        fetchData();
    }, [debouncedSearch]);

    return (
        <Context.Provider
            value={{
                dataUser,
                dataPayment,
                setDataPayment,
                fetchAuth,
                dataSearch,
                setValueSearch,
                dataMessages,
                setDataMessages,
                globalUsersMessage,
                setGlobalUsersMessage,
            }}
        >
            {children}
        </Context.Provider>
    );
}
