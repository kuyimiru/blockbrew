import React from 'react';

/**
 * ErrorBoundary — 捕获 React 渲染树中的任何错误
 * 防止单个组件崩溃导致整个应用白屏
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] React 组件崩溃:', error.message, error.stack);
    console.error('[ErrorBoundary] 组件栈:', info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0B0B0B', color: '#F1F1F1',
          flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
          textAlign: 'center', padding: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧊</div>
          <h1 style={{ color: '#DC2626', fontSize: 20, marginBottom: 8 }}>组件渲染错误</h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, maxWidth: 400, lineHeight: 1.6, marginBottom: 4 }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <p style={{ color: '#6B7280', fontSize: 11 }}>请尝试刷新页面或点击下方按钮重试</p>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 16, background: '#DC2626', color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
            }}
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, background: 'transparent', color: '#9CA3AF', border: '1px solid #2C2C2C',
              padding: '8px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
