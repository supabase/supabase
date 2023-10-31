# Both OpenAI & Huggingface in the same Edge Function

## Setup Environment Variables

To set up the required environment variables, you can create a `.env` file based on an example file. Here's an example of how to do it:

```bash
cp .env.example .env
```

Make sure to replace the values in the `.env` file with your actual tokens or keys.

## Run Locally

To run the Deno edge function locally, use the following command:

```bash
deno run --allow-net both-openai-huggingface.ts
```

This command allows Deno to access the network and execute your function.

Use cURL or any HTTP client to make a POST request to your locally running function. For example:

```bash
curl -i --location --request POST http://localhost:your_port/both-openai-huggingface \
  --header 'Content-Type: application/json' \
  --data '{"query":"Your Request Data"}'
```

## Deploy

To deploy your Deno edge function, follow these steps:

1. Ensure you have the Deno runtime and dependencies installed on your target server.

2. Upload your function file to the server.

3. Run the function on your server using the appropriate command.

4. Make sure to set the required environment variables on your server for the function to work correctly.

That's it! Your Deno edge function is now deployed and ready to be used.
