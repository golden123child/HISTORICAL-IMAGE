import { useApp } from './context/AppContext';
import AuthLayout from './components/auth/AuthLayout';
import SurveyLayout from './components/survey/SurveyLayout';

export default function App() {
  const { state } = useApp();

  if (!state.isAuthenticated) {
    return <AuthLayout />;
  }

  return <SurveyLayout />;
}
