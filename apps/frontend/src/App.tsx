import { App as AntdApp, ConfigProvider } from "antd";
import { AppRouter } from "@/router/AppRouter";

export default function App() {
  return (
    <ConfigProvider>
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
}
