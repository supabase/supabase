---
title: 'Executing Dynamic JavaScript Code on Supabase with Edge Functions'
description: 'Learn how to execute dynamic JavaScript code on Supabase using Edge Functions.'
author: rodrigo_mansueli
imgSocial: 2024-11-13-supabase-dynamic-functions/dynamic-og.png
imgThumb: 2024-11-13-supabase-dynamic-functions/dynamic-og.png
categories:
  - engineering
tags:
  - edge-function
  - functions
  - AI
date: '2024-11-13'
toc_depth: 3
---

We're always looking for ways to improve the developer experience and reduce complexity across your application development pipeline. One way you can use Supabase to do that is with dynamic JavaScript in Edge Functions. This greatly increases the versatility of your edge functions and reduces the need for you to redeploy your functions if you need to change business logic.

## Introduction to Edge Functions

Edge Functions in Supabase are serverless functions that execute in response to HTTP requests. These functions are deployed at the edge, meaning they run close to the user's location, resulting in faster response times.

### Why Use Dynamic Code Execution?

Dynamic code execution allows you to modify and run JavaScript code on the fly without having to redeploy your function each time the code changes. This is particularly useful when you need the flexibility to execute different logic depending on the incoming request, without incurring the overhead of redeployment.

### Prerequisites

To follow along, you will need:

- A Supabase project
- Supabase CLI installed on your local machine
- Orb Stack or Docker Desktop installed on your local machine
- Environment variables set up in Vault, ensuring it passes validation in the function (e.g., `service_role`)

> Edge Functions defaults to the verification of the JWT, so it could be called with the ANON API Key. Make sure to implement proper security measures.

## Install the SQL script from the repo

We have a repo with the SQL script to create helper functions to support the dynamic execution of JavaScript code. You can find the repo here: [supa-dynamic](https://github.com/mansueli/supa-dynamic)

Install the SQL script `supa-dynamic--0.1.sql` from the repo in your Supabase project. (You can copy and paste the code from the repo into the SQL editor in your Supabase project.)
These are the functions we'll use to execute the JavaScript code:

- `edge.http_request(url text, method text, headers jsonb, params jsonb, payload jsonb, timeout_ms integer) RETURNS jsonb`: Makes an HTTP request with the specified parameters.
- `edge_wrapper(code text) RETURNS text`: Executes the provided JavaScript code.
- `edge.get_secret(secret_name text) RETURNS text`: Retrieves a secret from Vault.

### Deep Dive into the helper functions (optional)

You can skip this section if you are only interested in using the dynamic execution of JavaScript code. However, if you want to understand how the helper functions work, keep reading.

#### Function: edge.http_request

This function handles the actual HTTP request and processes the response. It ensures consistency in response format.

```sql
CREATE OR REPLACE FUNCTION edge.http_request(
    url TEXT,
    method TEXT DEFAULT 'POST',
    headers JSONB DEFAULT '{"Content-Type": "application/json"}'::jsonb,
    params JSONB DEFAULT '{}'::jsonb,
    payload JSONB DEFAULT '{}'::jsonb,
    timeout_ms INTEGER DEFAULT 5000
) RETURNS jsonb AS $$
DECLARE
    http_response extensions.http_response;
    status_code integer := 0;
    response_json jsonb;
    response_text text;
    header_array extensions.http_header[];
    request extensions.http_request;
BEGIN
    -- Set the timeout option
    IF timeout_ms > 0 THEN
        PERFORM http_set_curlopt('CURLOPT_TIMEOUT_MS', timeout_ms::text);
    END IF;

    -- Convert headers JSONB to http_header array
    SELECT array_agg(extensions.http_header(key, value::text))
    FROM jsonb_each_text(headers)
    INTO header_array;

    -- Construct the http_request composite type
    request := ROW(method, url, header_array, 'application/json', payload::text)::extensions.http_request;

    -- Make the HTTP request
    http_response := http(request);
    status_code := http_response.status;

    -- Attempt to extract JSONB response content
    BEGIN
        response_json := http_response.content::jsonb;
    EXCEPTION
        WHEN others THEN
            response_text := http_response.content;
            response_json := jsonb_build_object('status_code', status_code, 'response', response_text);
    END;

    RETURN jsonb_build_object('status_code', status_code, 'response', response_json);
END;
$$ LANGUAGE plpgsql;

```

#### Function: edge.edge_wrapper

The `edge_wrapper` function manages HTTP requests with features like retries, custom headers, and region selection. Below are the parameters it accepts:

- **`url`**: The endpoint to call.
- **`method`**: HTTP method, defaulting to `POST`.
- **`headers`**: Custom headers to include, including region information.
- **`timeout_ms`**: Timeout duration in milliseconds.
- **`max_retries`**: Maximum retry attempts for the request.

```sql
CREATE OR REPLACE FUNCTION edge.edge_wrapper(
    url TEXT,
    method TEXT DEFAULT 'POST',
    headers JSONB DEFAULT '{"Content-Type": "application/json"}'::jsonb,
    params JSONB DEFAULT '{}'::jsonb,
    payload JSONB DEFAULT '{}'::jsonb, -- Payload as JSONB
    timeout_ms INTEGER DEFAULT 5000,
    max_retries INTEGER DEFAULT 0,
    allowed_regions TEXT[] DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    retry_count INTEGER := 0;
    retry_delays DOUBLE PRECISION[] := ARRAY[0, 0.250, 0.500, 1.000, 2.500, 5.000];
    succeeded BOOLEAN := FALSE;
    current_region_index INTEGER := 1; -- Start index at 1 for PostgreSQL array
    combined_headers JSONB;
    response_json JSONB;
BEGIN
    -- Validate headers, params, and payload are JSON objects
    IF headers IS NULL OR NOT jsonb_typeof(headers) = 'object' THEN
        RAISE EXCEPTION 'Invalid headers parameter: %', headers;
    END IF;

    IF params IS NULL OR NOT jsonb_typeof(params) = 'object' THEN
        RAISE EXCEPTION 'Invalid params parameter: %', params;
    END IF;

    IF payload IS NULL OR NOT jsonb_typeof(payload) = 'object' THEN
        RAISE EXCEPTION 'Invalid payload parameter: %', payload;
    END IF;

    -- Validate allowed_regions if provided
    IF allowed_regions IS NOT NULL AND cardinality(allowed_regions) = 0 THEN
        RAISE EXCEPTION 'allowed_regions parameter cannot be an empty array';
    END IF;

    -- Check if retry_delays has enough elements
    IF cardinality(retry_delays) < max_retries + 1 THEN
        RAISE EXCEPTION 'retry_delays array must have at least % elements', max_retries + 1;
    END IF;

    -- Retry loop
    WHILE NOT succeeded AND retry_count <= max_retries LOOP
        combined_headers := headers;

        -- Set x-region header if allowed_regions is provided
        IF allowed_regions IS NOT NULL AND cardinality(allowed_regions) > 0 THEN
            combined_headers := combined_headers || jsonb_build_object('x-region', allowed_regions[current_region_index]);
        END IF;

        -- Sleep if not the first attempt
        IF retry_count > 0 THEN
            PERFORM pg_sleep(retry_delays[retry_count]);
        END IF;

        retry_count := retry_count + 1;

        -- Increment region index, wrapping around if necessary
        IF allowed_regions IS NOT NULL AND cardinality(allowed_regions) > 0 THEN
            current_region_index := current_region_index + 1;
            IF current_region_index > cardinality(allowed_regions) THEN
                current_region_index := 1;
            END IF;
        END IF;

        BEGIN
            RAISE WARNING 'headers:%s', combined_headers;

            -- Call the simplified HTTP request function
            response_json := edge.http_request(url, method, combined_headers, params, payload, timeout_ms);

            -- Check the status code
            IF (response_json->>'status_code')::INTEGER < 500 THEN
                succeeded := TRUE;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'HTTP request failed after % retries. SQL Error: { %, % }',
                        max_retries, SQLERRM, SQLSTATE;
                END IF;
        END;
    END LOOP;

    RETURN response_json;
END;
$$ LANGUAGE plpgsql;

```

To securely manage secrets, you will need to set your `service_role_key` in Vault. Here’s how you can create a function to retrieve secrets:

```sql
CREATE OR REPLACE FUNCTION edge.get_secret(secret_name text) RETURNS text
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    decrypted text;
BEGIN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' OR current_user = 'postgres' THEN
        SELECT decrypted_secret
        INTO decrypted
        FROM vault.decrypted_secrets
        WHERE name = secret_name;
        RETURN decrypted;
    ELSE
        RAISE EXCEPTION 'Access denied: only service_role or postgres user can execute this function.';
    END IF;
END;
$$;
```

This function can retrieve the `service_role` secret from [Vault](https://supabase.com/dashboard/project/_/settings/vault/secrets), it also ensures that only authorized roles can access sensitive environment variables.

## Setting Up the Edge Function

Let's dive into the code and set up our dynamic JavaScript executor Edge Function using Deno. Below is an overview of how to accomplish this.

### Code Walkthrough

We'll create a function named `multi-purpose`:

```jsx
supabase functions new multi-purpose
```

Now, we'll edit the code adding verification and the eval function, including the supabase client so we have it ready without the need to import.

```tsx
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Import the supabase client
import { createClient } from "<https://esm.sh/@supabase/supabase-js@2>";

console.log("===\\n\\tBooted Edge Worker!\\n===\\n");
const supabase_url = Deno.env.get("SUPABASE_URL") ?? "";
const service_role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// Set the permission to service_role key:
const supabase = createClient(supabase_url, service_role);
// This allows us to use Supabase.ai in the function
const session = new Supabase.ai.Session('gte-small');

Deno.serve(async (req: Request) =>
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Authorization header is missing.");
  // Ensures that the function is called with service_role to prevent missuse
  if (!authorization.includes(service_role)) {
    throw new Error("Authorization header is invalid.");
  }

  const { code } = await req.json();
  try {
    // Wrap the provided code in an async function context
    const asyncFunction = new Function('supabase', `
      return (async () => {
        ${code.replace(/\\\\/g, '')}
      })();
    `);
    // Pass the Supabase client as the scope for the function to use:
    const data = await asyncFunction(supabase);
    console.log(data);
    return new Response(
      JSON.stringify({ data }),
      { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' } },
    );
  } catch (error) {
    console.error("Error executing user code:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred -> " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

```

> Note: If you need more details, check the full guide to [create an edge function](https://supabase.com/docs/guides/functions/quickstart#create-an-edge-function).

### Step-by-Step Walkthrough

1. **Validate Authorization**: First, we ensure the request contains a valid authorization header. (this prevents calls from anon users)

```jsx
const authorization = req.headers.get('Authorization')
if (!authorization) throw new Error('Authorization header is missing.')
// Ensures that the function is called with service_role to prevent missuse
if (!authorization.includes(service_role)) {
  throw new Error('Authorization header is invalid.')
}
```

1. **Receive JavaScript Code Payload**: Extract the `code` from the request body.

```jsx
const { code } = await req.json()
```

1. **Wrap Code in Async Context**: Use `new Function()` to create an async function that executes the incoming JavaScript code. This allows async calls in the code to be executed:

```jsx
try {
    // Wrap the provided code in an async function context
    const asyncFunction = new Function('supabase', `
      return (async () => {
        ${code.replace(/\\\\/g, '')}
      })();
    `);
}
```

1. **Execute and Return Results**: Run the JavaScript code, which can interact with Supabase via the provided client, and return the results.

```jsx
// Pass the Supabase client as the scope for the function to use:
const data = await asyncFunction(supabase)
console.log(data)
return new Response(JSON.stringify({ data }), {
  headers: { 'Content-Type': 'application/json', Connection: 'keep-alive' },
})
```

### Deploying the Edge Function

To deploy this Edge Function, you'll need to use the Supabase CLI. Ensure you have Docker installed and running on your local machine. Follow these steps to deploy:

1. **Install the Supabase CLI**: If you haven't already, install the Supabase CLI by following the instructions in the [Supabase CLI Documentation](https://supabase.com/docs/guides/cli).
2. **Log In to Supabase**: Use the command `supabase login` to authenticate your account.
3. **Deploy the Function**: Run the command `supabase functions deploy <function_name>` to deploy your Edge Function. Replace `<function_name>` with the desired name for your function.

### Setting Environment Variables in Vault

## Creating the main function to interact with the edge function

We are using the helper functions defined earlier to create a function that interacts with the edge function. This function will execute the dynamic JavaScript code and return the results.
This is the main function that will be used to execute the dynamic JavaScript code and return the results.

### `edge.exec` Function

The `edge.exec` is a simple function leverages `edge_wrapper` to execute dynamic JavaScript code. Here's an example of how it is structured:

```sql
CREATE OR REPLACE FUNCTION edge.exec(data text) RETURNS JSONB LANGUAGE plpgsql
AS $function$
DECLARE
    custom_headers JSONB;
-- Example restricting regions available to Europe
    allowed_regions TEXT[] := ARRAY['eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-central-1'];
BEGIN
    -- Set headers with anon key and Content-Type
    custom_headers := jsonb_build_object(
        'Authorization', 'Bearer ' || edge.get_secret('service_role_key'),
        'Content-Type', 'application/json',
        'x-region', allowed_regions
    );
    -- Call edge_wrapper function with default values
    RETURN edge.edge_wrapper(
        url := ('https://<ref>.supabase.co/functions/v1/multi-purpose'),
        headers := custom_headers,
        payload := jsonb_build_object('code', data),
        max_retries := 5,
        allowed_regions := allowed_regions
    );
END;
$function$;

```

### Executing Dynamic JavaScript Code

The key to executing the dynamic JavaScript code is wrapping it in an `async` function context using `new Function()`. This approach lets you evaluate the code in isolation while retaining access to the `supabase` client for interacting with your database. You can check the examples of how to use this calling the [supabase client](https://www.notion.so/Executing-Dynamic-JavaScript-Code-on-Supabase-with-Edge-Functions-1125004b775f80ca97d4c367a2cfcd7d?pvs=21) or even [generating embeddings](https://www.notion.so/Executing-Dynamic-JavaScript-Code-on-Supabase-with-Edge-Functions-1125004b775f80ca97d4c367a2cfcd7d?pvs=21).

### Example of Using Supabase Client Libraries

To demonstrate the execution of dynamic JavaScript, you can use the Supabase client libraries within the SQL context. Here’s an example query:

```sql
SELECT edge.exec(
  $js$
  const { data, error } = await supabase.rpc('postgres_function', {'foo': 'bar'});
  if (error) {
    return new Response(JSON.stringify({ error: "An error occurred ->" + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return data;
  $js$
);

```

## Using the Edge Function in Practice

### Example: Generating Embeddings

The `edge.exec` function allows for dynamic JavaScript execution, such as interacting with an AI session to generate embeddings. When executed, the JavaScript code within the SQL context runs through the edge function, returning results to the database.

```sql
select edge.exec(
$js$

const session = new Supabase.ai.Session('gte-small');
return await session.run('hello world');

$js$);
```

You can also create a Postgres function to generate embeddings:

```
CREATE OR REPLACE FUNCTION edge.generate_embedding(input_text TEXT) RETURNS JSONB AS $$
DECLARE
    response JSONB;
BEGIN
    -- Call the edge function to generate the embedding for the provided text
    response := edge.exec(
        format(
            $js$
            const session = new Supabase.ai.Session('gte-small');
            return await session.run(%L);
            $js$,
            input_text
        )
    );
    RETURN response->'response'->'data';
END;
$$ LANGUAGE plpgsql;

 select edge.generate_embedding('The quick brown fox jumps over the lazy dog');

-- response:
-- [-0.07254139333963394,-0.02173878252506256,0.042930446565151215,0.04853367060422897,0.015609614551067352,0.02912059798836708,0.0371023565530777,0.05054798722267151,0.0035842431243509054,0.0015563230263069272,0.0009484672918915749,-0.09247169643640518,0.04190639406442642,0.05874202027916908,-0.012341015040874481,0.01661474071443081,-0.013452880084514618,0.003742767730727792,-0.07664268463850021,0.03231268376111984,0.0006968052475713193,-0.06508929282426834,-0.04956015944480896,-0.014327225275337696,0.03270547464489937,0.01635774038732052,-0.022707758471369743,-0.007586371619254351,-0.03548099845647812,-0.17844657599925995,0.03325255215167999,-0.07009242475032806,0.02982083335518837,-0.05649203434586525,-0.006693259347230196,-0.02781110256910324,-0.01687553897500038,0.04976152256131172,-0.015715090557932854,0.038247860968112946,0.040495794266462326,-0.007263457402586937,-0.019288228824734688,-0.0527581050992012,-0.0065462407656013966,-0.022786622866988182,-0.04975651577115059,-0.04053974151611328,0.03047902137041092,-0.05064946785569191,-0.023929744958877563,-0.03891737014055252,0.03785012289881706,-0.0133274607360363,0.03001898154616356,-0.007281183265149593,0.060004156082868576,0.017414024099707603,0.025516854599118233,0.029599720612168312,0.02893918938934803,0.03455337509512901,-0.14698833227157593,0.09387505799531937,0.05768263339996338,0.019130567088723183,-0.0380706787109375,-0.04105521738529205,0.008963614702224731,0.012743324972689152,0.009223062545061111,0.060711149126291275,0.007398003712296486,0.04229794815182686,0.046996768563985825,-0.003397924592718482,0.00808036606758833,0.022617157548666,-0.01847437582910061,0.0026343590579926968,-0.010598739609122276,-0.037673674523830414,-0.04375630244612694,-0.0007789010996930301,-0.007935777306556702,-0.03272915259003639,0.021433845162391663,-0.07967976480722427,0.06888656318187714,0.07489841431379318,-0.02783842757344246,-0.006374717690050602,-0.035476282238960266,0.006344574969261885,-0.03357071802020073,-0.036727335304021835,0.012309364043176174,-0.00006389369809767231,-0.053050097078084946,0.19709722697734833,-0.05575009435415268,0.05757850036025047,0.0951322615146637,-0.04633559286594391,0.03476420044898987,0.012983368709683418,0.0004390157700981945,0.010212302207946777,-0.012741461396217346,0.014706282876431942,0.03321540355682373,-0.006495281588286161,0.041682176291942596,0.003406582633033395,0.02581774815917015,-0.0007246752502396703,0.011133069172501564,0.08353550732135773,0.006477882619947195,0.00224463758058846,0.020395604893565178,-0.013416256755590439,0.05663946643471718,-0.028388522565364838,0.019082417711615562,-0.08387858420610428,0.054498571902513504,0.10694538056850433,0.06286843866109848,0.03180928900837898,0.037740662693977356,-0.07479764521121979,0.010231229476630688,-0.04866624251008034,0.004061027429997921,0.0362103171646595,-0.009540606290102005,0.00915283989161253,0.031154874712228775,-0.04876647889614105,-0.015956921502947807,-0.1429857611656189,-0.01470054779201746,-0.09399641305208206,-0.019157350063323975,0.02896934375166893,-0.018669532611966133,0.014991801232099533,-0.06764508783817291,0.027312103658914566,-0.003859955817461014,0.025718173012137413,-0.018675100058317184,-0.016409857198596,-0.021459592506289482,0.004702075384557247,-0.0323822982609272,0.10394860059022903,-0.020106177777051926,-0.008876764215528965,-0.027185838669538498,0.0003392586368136108,-0.009877108968794346,-0.0004303457390051335,0.04185814782977104,-0.05188998952507973,-0.021185973659157753,0.00026368125691078603,-0.02180171199142933,-0.03400561958551407,0.020068379119038582,0.034275852143764496,-0.10943055897951126,0.031987469643354416,0.054017845541238785,-0.009243185631930828,-0.07103140652179718,0.00785127654671669,-0.0040434580296278,-0.05036382004618645,0.07858535647392273,-0.08356015384197235,-0.06914680451154709,0.06180981919169426,0.043073058128356934,-0.020246226340532303,-0.015496478416025639,-0.005946696270257235,0.006562687456607819,0.04845070466399193,-0.029123008251190186,0.02194702997803688,0.002446065191179514,-0.06825454533100128,-0.07056894898414612,0.01598423719406128,-0.04185032472014427,-0.01633128523826599,0.014294272288680077,-0.01768324337899685,0.05590462312102318,-0.044063832610845566,0.02461099997162819,0.0006756667862646282,0.07429251074790955,0.011551265604794025,0.014212443493306637,-0.02237367257475853,0.039057254791259766,0.000325449975207448,-0.004185846075415611,-0.003040974261239171,0.01800958439707756,-0.02479490265250206,-0.019247515127062798,0.04366869106888771,-0.027130864560604095,0.018955133855342865,0.03239727392792702,0.03226468712091446,0.06487660109996796,-0.06456360220909119,0.0006639647181145847,-0.20788206160068512,0.05066373199224472,-0.012870946899056435,-0.034873317927122116,0.023824242874979973,-0.02305314689874649,0.030056791380047798,-0.06937119364738464,0.0642433762550354,0.05418730527162552,0.06050065532326698,-0.04655877873301506,-0.026898164302110672,-0.003803820814937353,0.002598312683403492,0.1081414744257927,0.014850604347884655,0.013619652017951012,0.013523285277187824,-0.0016119466163218021,-0.00329813570715487,0.002907108049839735,0.014589778147637844,-0.048919934779405594,0.056754376739263535,-0.03171522915363312,0.2308642566204071,0.08356188982725143,0.05350973457098007,-0.03191335126757622,0.003732810029760003,0.031172126531600952,-0.08899383991956711,-0.09938952326774597,0.08256369829177856,0.08178982138633728,0.07785400003194809,-0.04618730768561363,-0.02995850332081318,-0.022348755970597267,-0.05898110195994377,0.05294518917798996,0.0038859194610267878,-0.0923057422041893,-0.01576364040374756,-0.0035308743827044964,-0.04901731014251709,-0.012596397660672665,-0.036502618342638016,0.00886201299726963,0.059619251638650894,-0.017561428248882294,0.05459151417016983,0.04560315981507301,-0.0019153780303895473,0.009595169685781002,-0.057729125022888184,0.026341130957007408,-0.023892194032669067,0.016832968220114708,-0.026450062170624733,-0.07305766642093658,0.03468620404601097,-0.02054707705974579,0.041034333407878876,0.00404499564319849,-0.017474710941314697,-0.043891143053770065,0.02514275535941124,0.02372695878148079,0.010677577927708626,0.06225359067320824,0.040919024497270584,0.005154050886631012,0.030111495405435562,0.0054080006666481495,0.03592434898018837,0.0001651789789320901,0.017304912209510803,-0.01922907680273056,0.04822206869721413,-0.0688890889286995,0.019858958199620247,-0.0008752745925448835,0.03513675928115845,-0.07729781419038773,0.08145932108163834,-0.0327017717063427,0.03425054997205734,-0.08482713997364044,0.006879036780446768,0.059308722615242004,-0.03618019446730614,-0.056978799402713776,-0.021730659529566765,-0.0007874490693211555,-0.30017349123954773,0.011467894539237022,0.0029629627242684364,-0.00585860526189208,-0.010300826281309128,0.023507587611675262,0.009586751461029053,0.01615791581571102,-0.05407087132334709,-0.0025957857724279165,-0.005770532879978418,0.03627054765820503,0.03723520413041115,0.0002953026269096881,-0.01028500497341156,0.003999052103608847,-0.005846572108566761,0.033623822033405304,-0.0072589460760355,-0.07468357682228088,0.03272583335638046,-0.00448765279725194,0.21248994767665863,-0.057705674320459366,0.044046953320503235,0.03008623979985714,-0.018218697980046272,0.04393533617258072,0.07603447884321213,-0.04150347039103508,0.06695082038640976,-0.010416779667139053,0.08510852605104446,-0.07743050903081894,-0.005964982323348522,0.03540671616792679,-0.036865249276161194,0.058287233114242554,0.005791360046714544,-0.03530560061335564,-0.010620728135108948,0.03216135874390602,0.012065712362527847,-0.05922657623887062,0.08696120232343674,-0.051534030586481094,-0.08612160384654999,-0.04676511138677597,-0.005788259673863649,0.06060168892145157,-0.02552523836493492,-0.02923434041440487,-0.05256013199687004,0.0033684736117720604,0.023232899606227875,0.023369308561086655,-0.02598796784877777,-0.02167469449341297,-0.05872185155749321,-0.0459195151925087,0.008857548236846924,-0.07634632289409637,0.016223475337028503,0.03924580290913582,0.11316763609647751]
```

### Example: Creating Users via Admin API

You can also leverage the admin API to create users:

```jsx
select edge.exec(
$js$

const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@email.com',
  password: 'password',
  user_metadata: { name: 'Yoda' }
});

$js$));

```

## Conclusion

As you can see, combining dynamic Javascript in Edge Functions with a few SQL support functions gets you a powerful new set of tools. By leveraging the edge_wrapper, edge.http_request, and `edge.exec` functions, developers can create robust and flexible serverless applications that can dynamically execute JavaScript code while interacting with PostgreSQL databases.

As we continue to build and innovate with Supabase, combining edge functions and SQL support functions opens up new avenues for building scalable, efficient, and secure applications. Whether developing a simple project or a complex application, these tools provide the flexibility and power to bring your ideas to life.
