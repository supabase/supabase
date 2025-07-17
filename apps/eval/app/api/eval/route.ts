import { type NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { generateAssistantResponse } from 'ai-commands/edge'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { createSupabaseApiPlatform, createSupabaseMcpServer } from '@supabase/mcp-server-supabase'

const credentialProvider = createCredentialChain(
  // AWS profile will be used for local development
  fromNodeProviderChain({
    profile: process.env.AWS_BEDROCK_PROFILE,
  })
)

const evaluationSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(10)
    .describe('Score from 1-10 based on how well the response matches the expected outcome'),
  reason: z
    .string()
    .describe('Detailed explanation of the score, highlighting strengths and weaknesses'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Evaluation API called ===')

    const body = await request.json()
    const {
      prompt,
      expectedOutcome,
      provider = 'openai',
      model: modelName = 'gpt-4.1-mini',
      optInLevel = 'schema_and_logs',
    } = body

    const bedrock = createAmazonBedrock({
      credentialProvider,
      region: 'us-east-1',
    })

    const model = bedrock(modelName)

    console.log('Request details:')
    console.log('- Provider:', provider)
    console.log('- Model:', model)
    console.log('- Opt-in Level:', optInLevel)
    console.log('- Prompt:', prompt?.substring(0, 100) + (prompt?.length > 100 ? '...' : ''))
    console.log(
      '- Expected outcome:',
      expectedOutcome?.substring(0, 100) + (expectedOutcome?.length > 100 ? '...' : '')
    )

    if (!prompt || !expectedOutcome) {
      console.error('Missing required fields:', {
        prompt: !!prompt,
        expectedOutcome: !!expectedOutcome,
      })
      return NextResponse.json({ error: 'Missing prompt or expectedOutcome' }, { status: 400 })
    }

    console.log(`=== Starting assistant response generation with ${model} ===`)

    console.log(
      'parameters:',
      process.env.SUPABASE_ACCESS_TOKEN,
      process.env.SUPABASE_PROJECT_REF,
      process.env.API_URL?.replace('/platform', '')
    )

    // Step 1: Generate assistant response using streamText with the specified model and optInLevel
    // Create the OpenAI model object here instead of in generateAssistantResponse
    const assistantResult = await generateAssistantResponse({
      model: model, // Pass the full model object instead of string
      messages: [{ role: 'user', content: prompt }],
      accessToken: process.env.SUPABASE_ACCESS_TOKEN!,
      projectRef: process.env.SUPABASE_PROJECT_REF!,
      isPlatform: false,
      apiUrl: 'https://api.supabase.com',
      chatName: 'Untitled',
      optInLevel: optInLevel as 'disabled' | 'schema' | 'schema_and_logs' | 'schema_and_logs_data',
    })

    console.log('assistantResult', assistantResult)

    let fullText = ''
    for await (const textPart of assistantResult.textStream) {
      fullText += textPart
    }

    console.log('Stream consumed successfully, text length:', fullText.length)

    // Now we can safely access the final assistantResults
    const finalText = await assistantResult.text
    const finishReason = await assistantResult.finishReason
    const usage = await assistantResult.usage
    const steps = await assistantResult.steps

    console.log('Final assistantResults accessed:')
    console.log('- Text length:', finalText.length)
    console.log('- Finish reason:', finishReason)
    console.log('- Usage:', usage)

    // Update captured usage with final values
    let capturedUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    if (usage) {
      capturedUsage = {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      }
    }

    const parsedResponse = {
      text: finalText,
      usage: capturedUsage,
      steps,
      finishReason: finishReason || 'stop',
      toolCalls: [],
      toolResults: [],
    }

    console.log(`=== Assistant response completed for ${model} ===`)
    console.log('- Response length:', parsedResponse.text.length)
    console.log('- Steps count:', parsedResponse.steps.length)
    console.log('- Usage:', parsedResponse.usage)

    console.log('=== Starting LLM judge evaluation ===')

    // Step 2: Use LLM as judge to evaluate the complete response
    const { object: evaluation } = await generateObject({
      model: openai('gpt-4o-mini'), // Use consistent model for judging
      schema: evaluationSchema,
      prompt: `
        You are an expert evaluator tasked with scoring an AI assistant's response.

        Model Used: ${model}
        Opt-in Level: ${optInLevel}
        User Prompt: "${prompt}"
        Expected Outcome: "${expectedOutcome}"

        Assistant's Complete Response: "${parsedResponse.text}"

        Response Details:
        - Finish Reason: ${parsedResponse.finishReason}
        - Number of Steps: ${parsedResponse.steps.length}
        - Full Steps Breakdown:
        ${JSON.stringify(parsedResponse.steps, null, 2)}

        Please evaluate how well the assistant's response matches the expected outcome.
        Consider factors like:
        - Accuracy and correctness of the final answer
        - Quality of reasoning process (if multi-step)
        - Appropriate use of tools (if any)
        - Completeness and relevance to the prompt
        - Clarity of explanation

        Provide a score from 1-10 where:
        - 1-3: Poor response, significantly misses the mark
        - 4-6: Adequate response, partially meets expectations
        - 7-8: Good response, meets most expectations
        - 9-10: Excellent response, exceeds expectations

        In your stepAnalysis, specifically comment on the reasoning process and any tool usage.
        Be specific in your reasoning and explain what the assistant did well and what could be improved.
      `,
    })

    console.log(`=== Evaluation completed successfully for ${model} ===`)
    console.log('- Score:', evaluation.score)
    console.log('- Reason length:', evaluation.reason.length)

    const response = {
      ...evaluation,
      usage: parsedResponse.usage,
      assistantResponse: parsedResponse.text,
      steps: parsedResponse.steps,
      toolCalls: parsedResponse.toolCalls,
      finishReason: parsedResponse.finishReason,
      provider: provider, // Include the provider used
      model: model, // Include the model used in the response
      optInLevel: optInLevel, // Include the opt-in level used
    }

    console.log(`=== Returning response for ${model} ===`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('=== ERROR in evaluation API ===')
    console.error('Error:', error)

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Error details:', { message: errorMessage, stack: errorStack })

    return NextResponse.json(
      {
        error: 'Failed to evaluate response',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
