import { Button, Space, Typography } from "antd";

export default function App() {
  return (
    <main className="app-shell">
      <section className="app-panel">
        <Space direction="vertical" size={16} align="center">
          <Typography.Title level={1}>AI Chat Frontend</Typography.Title>
          <Typography.Text type="secondary">
            Frontend placeholder for the Vite React app.
          </Typography.Text>
          <Button type="primary">Ant Design Button</Button>
        </Space>
      </section>
    </main>
  );
}
