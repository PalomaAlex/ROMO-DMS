import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router";
import {
  Refine,
  Authenticated,
} from "@refinedev/core";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { dataProvider, liveProvider } from "@refinedev/supabase";

import {
  // AuthPage,
  ErrorComponent,
  useNotificationProvider,
  // ThemedLayout,
  // ThemedSider,
  // ThemedTitle,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { App as AntdApp, ConfigProvider } from "antd";
import { GithubOutlined, AppstoreOutlined } from "@ant-design/icons";

import { supabaseClient } from "./utility";
import { AuthPage } from "./pages/auth";
import authProvider from "./provider/authProvider";

import { ColorModeContextProvider } from "./contexts/color-mode";
import { ThemedLayout,ThemedHeader,ThemedSider,ThemedTitle, } from "./components/layout";

import { TUserDashboard } from "./pages/organization/t_user";
import { TDeptDashboard } from "./pages/organization/t_dept";
import { TRoleDashboard } from "./pages/organization/t_role";
import { TPostDashboard } from "./pages/organization/t_post";

function App() {
  return (
    <BrowserRouter>
      <div style={{ background: "#1677ff", color: "#fff", padding: "4px 16px", textAlign: "center" }}>
        🚀 欢迎使用数据管理系统！
      </div>
      <RefineKbarProvider>
        <ColorModeContextProvider>
        {/* <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#3ecf8e",
              colorText: "#80808a",
              colorError: "#fa541c",
              colorBgLayout: "#f0f2f5",
              colorLink: "#3ecf8e",
              colorLinkActive: "#3ecf8e",
              colorLinkHover: "#3ecf8e",
            },
          }}
        > */}
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(supabaseClient)}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerProvider}
                notificationProvider={useNotificationProvider}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "lbPq2D-6XcsGl-yka7Ae",
                  title: {
                    text: "数据管理系统",
                    // icon: <AppstoreOutlined style={{ fontSize: 20 }} />,
                    icon: <img src="/Volcano-logo.ico" alt="logo" style={{ width: "1.5em", }} />
                  },
                }}
                resources={[{
                  name: "organization",
                  meta: {
                    label: "组织管理",
                  },
                }, {
                  name: "t_user",
                  list: "/organization/t_user",
                  meta: {
                    label: "用户管理",
                    parent: "organization",
                  },
                }, {
                  name: "t_dept",
                  list: "/organization/t_dept",
                  meta: {
                    label: "部门管理",
                    parent: "organization",
                    idField: "dept_id",
                  },
                }, {
                  name: "t_post",
                  list: "/organization/t_post",
                  create: "/organization/t_post/create",
                  edit: "/organization/t_post/edit/:id",
                  show: "/organization/t_post/show/:id",
                  meta: {
                    label: "岗位管理",
                    parent: "organization",
                  },
                }, {
                  name: "t_role",
                  list: "/organization/t_role",
                  create: "/organization/t_role/create",
                  edit: "/organization/t_role/edit/:id",
                  show: "/organization/t_role/show/:id",
                  meta: {
                    label: "权限管理",
                    parent: "organization",
                  },
                }]}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-routes"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout Header={ThemedHeader} Sider={ThemedSider} Title={ThemedTitle}>
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="t_user" />}
                    />

                    <Route path="/organization/t_user">
                      <Route index element={<TUserDashboard />} />
                    </Route>
                    <Route path="/organization/t_dept">
                      <Route index element={<TDeptDashboard />} />
                    </Route>
                    <Route path="/organization/t_role">
                      <Route index element={<TRoleDashboard />} />
                    </Route>
                    <Route path="/organization/t_post">
                      <Route index element={<TPostDashboard />} />
                    </Route>
                  </Route>

                  <Route
                    element={
                      <Authenticated key="auth-pages" fallback={<Outlet />}>
                        <Navigate to="/" />
                      </Authenticated>
                    }
                  >
                    <Route
                      path="/login"
                      element={
                        <AuthPage
                          type="login"
                          providers={[]}
                          rememberMe={false}
                          formProps={{
                            initialValues: {
                              email: "123456@test.com",
                              password: "123456",
                            },
                          }}
                        />
                      }
                    />
                    <Route path="/register" element={<AuthPage type="register" />} />
                    <Route
                      path="/forgot-password"
                      element={<AuthPage type="forgotPassword" />}
                    />
                    <Route
                      path="/update-password"
                      element={<AuthPage type="updatePassword" />}
                    />
                  </Route>

                  <Route
                    element={
                      <Authenticated key="catch-all">
                        <ThemedLayout>
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        {/* </ConfigProvider> */}
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
