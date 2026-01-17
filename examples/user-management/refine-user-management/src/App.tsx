import { Authenticated, Refine } from "@refinedev/core";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import { supabaseClient } from "./providers/supabase-client";
import { authProvider } from "./providers/auth-provider";
import { dataProvider, liveProvider } from "@refinedev/supabase";

import Account from "./components/account";
import Auth from "./components/auth";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider(supabaseClient)}
        liveProvider={liveProvider(supabaseClient)}
        authProvider={authProvider}
        routerProvider={routerProvider}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Routes>
          <Route
            element={
              <Authenticated
                key="authenticated-routes"
                fallback={<CatchAllNavigate to="/login" />}
              >
                <Outlet />
              </Authenticated>
            }
          >
            <Route index element={<Account />} />
          </Route>
          <Route
            element={<Authenticated key="auth-pages" fallback={<Outlet />} />}
          >
            <Route path="/login" element={<Auth />} />
          </Route>
        </Routes>
        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
      </Refine>
    </BrowserRouter>
  );
}

export default App;
