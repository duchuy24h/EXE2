import App from '../App';
import DetailPost from '../Pages/DetailPost/DetailPost';
import LoginUser from '../Pages/LoginUser/LoginUser';
import RegisterUser from '../Pages/RegisterUser/RegisterUser';
import Admin from '../Pages/Admin/Index';
import InfoUser from '../Pages/InfoUser/InfoUser';
import ForgotPassword from '../Pages/ForgotPassword/ForgotPassword';
import AISearch from '../Pages/AISearch/AISearch';
import Layout from '../Components/Layout/Layout';
import HomePage from '../Components/HomePage/HomePage';
import PassRoomPage from '../Pages/PassRoom/PassRoomPage';
import PassRoomDetailPage from '../Pages/PassRoom/PassRoomDetailPage';

export const publicRoutes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '', element: <HomePage /> },
            { path: 'chi-tiet-tin-dang/:id', element: <DetailPost /> },
            { path: 'pass-room', element: <PassRoomPage /> },
            { path: 'pass-room/:id', element: <PassRoomDetailPage /> },
            { path: 'trang-ca-nhan', element: <InfoUser /> },
            { path: 'search/:value', element: <AISearch /> },
        ],
    },
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '/admin', element: <Admin /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
];
