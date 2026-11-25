import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../auth/LoginForm.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <LoginForm onSwitch={() => navigate('/register')} />
    </div>
  );
}
