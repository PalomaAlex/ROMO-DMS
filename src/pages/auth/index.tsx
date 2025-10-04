import { AuthPage as AntdAuthPage, AuthProps } from "@refinedev/antd";
import { Link } from "react-router";

const authWrapperProps = {
  style: {
    background:
      "radial-gradient(50% 50% at 50% 50%,rgba(255, 255, 255, 0) 0%,rgba(0, 0, 0, 0.5) 100%),url('images/login-bg.png')",
    backgroundSize: "cover",
  },
};

const renderAuthContent = (content: React.ReactNode) => {
  return (
    <div
      style={{
        maxWidth: 408,
        margin: "auto",
      }}
    >
      <Link to="/">
        <img
          style={{ marginBottom: 30, display: "block", marginLeft: "auto", marginRight: "auto" }}
          src="/Volcano-logo.ico"
          alt="Logo"
          width="30%"
        />
      </Link>
      {content}
    </div>
  );
};

export const AuthPage: React.FC<AuthProps> = ({ type, formProps }) => {
  return (
    <AntdAuthPage
      type={type}
      wrapperProps={authWrapperProps}
      renderContent={renderAuthContent}
      formProps={formProps}
    />
  );
};