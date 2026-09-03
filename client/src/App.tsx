import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ui/Toast';
import { setCredentials, clearCredentials, setLoading } from './store/authSlice';
import api from './utils/api';

const AuthBootstrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Attempt to rotate / recover access token using secure refresh cookie
        const response = await api.get('/auth/refresh');
        const user = response.data.user || response.data.data?.user;
        const token = response.data.token || response.data.data?.token;
        if (user && token) {
          dispatch(setCredentials({ user, token }));
        }
      } catch (error) {
        // No active or valid refresh session exists, clear states
        dispatch(clearCredentials());
      } finally {
        dispatch(setLoading(false));
      }
    };

    restoreSession();
  }, [dispatch]);

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <BrowserRouter>
          <AuthBootstrapper>
            <AppRoutes />
          </AuthBootstrapper>
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  );
};

export default App;
