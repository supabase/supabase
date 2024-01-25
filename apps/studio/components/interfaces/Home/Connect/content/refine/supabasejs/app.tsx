import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="typescript">
        {`
import { Refine } from "@refinedev/core";
import routerBindings from "@refinedev/react-router-v6";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { BrowserRouter } from "react-router-dom";
import authProvider from "./authProvider";
import { supabaseClient } from "./utility/supabase";

function App() {
  return (
    <BrowserRouter>
        <Refine
          dataProvider={dataProvider(supabaseClient)}
          liveProvider={liveProvider(supabaseClient)}
          authProvider={authProvider}
          routerProvider={routerBindings}
          resources={...}>
        </Refine>
    </BrowserRouter>
  );
}

export default App;
`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
