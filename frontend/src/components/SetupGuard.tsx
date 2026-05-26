import { Navigate } from 'react-router-dom';

const SETUP_COMPLETED_KEY = 'setup_completed';

/**
 * 引导守卫：如果系统初始化引导未完成，重定向到引导页
 */
const SetupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setupCompleted = localStorage.getItem(SETUP_COMPLETED_KEY) === 'true';

  if (!setupCompleted) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

export default SetupGuard;
