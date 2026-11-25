import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../auth/RegisterForm.jsx';

export function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <RegisterForm onSwitch={() => navigate('/login')} />
    </div>
  );
}
