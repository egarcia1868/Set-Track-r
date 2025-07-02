import { useAuth0 } from "@auth0/auth0-react";
import Home from "./Home";
import Dashboard from "./Dashboard";

const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Dashboard /> : <Home />;
};
export default RootRoute;
