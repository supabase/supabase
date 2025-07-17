export interface GenerateAssistantResponseOptions {
  model: any // Accept the full model object instead of string
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  accessToken?: string // Mock for now
  projectRef?: string // Mock for now
  optInLevel?: "disabled" | "schema" | "schema_and_logs" | "schema_and_logs_data"
  onFinish?: (result: { usage: { promptTokens: number; completionTokens: number; totalTokens: number } }) => void
}

export interface GenerateAssistantResponseResult {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  steps: Array<{
    stepNumber: number
    text: string
    toolCalls: Array<any>
    toolResults: Array<any>
    finishReason: string
  }>
  finishReason: string
  toolCalls: Array<any>
  toolResults: Array<any>
}

export async function generateAssistantResponse(
  prompt: string,
  options?: GenerateAssistantResponseOptions,
): Promise<GenerateAssistantResponseResult> {
  const {
    model, // Now expects the full model object
    messages,
    accessToken, // Mock - not used yet
    projectRef, // Mock - not used yet
    optInLevel = "disabled", // Mock - not used yet
    onFinish,
  } = options || {}

  if (!model) {
    throw new Error("Model is required")
  }

  console.log("Starting generateAssistantResponse with model:", model)

  // Use messages if provided, otherwise create a simple user message
  const finalMessages = messages || [{ role: "user" as const, content: prompt }]

  let capturedUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }

  try {
    // Import streamText here to avoid circular dependencies
    const { streamText } = await import("ai")

    // Use streamText with the provided model object
    const result = streamText({
      model: model, // Use the full model object passed in
      messages: finalMessages,
      onFinish: ({ usage }) => {
        const { promptTokens, completionTokens, totalTokens } = usage

        capturedUsage = {
          promptTokens,
          completionTokens,
          totalTokens,
        }

        // Log usage for debugging
        console.log("Prompt tokens:", promptTokens)
        console.log("Completion tokens:", completionTokens)
        console.log("Total tokens:", totalTokens)

        // Call the provided onFinish callback if it exists
        if (onFinish) {
          onFinish({ usage: { promptTokens, completionTokens, totalTokens } })
        }
      },
    })

    console.log("StreamText initiated, consuming stream...")

    // Consume the stream to completion
    let fullText = ""
    for await (const textPart of result.textStream) {
      fullText += textPart
    }

    console.log("Stream consumed successfully, text length:", fullText.length)

    // Now we can safely access the final results
    const finalText = await result.text
    const finishReason = await result.finishReason
    const usage = await result.usage

    console.log("Final results accessed:")
    console.log("- Text length:", finalText.length)
    console.log("- Finish reason:", finishReason)
    console.log("- Usage:", usage)

    // Update captured usage with final values
    if (usage) {
      capturedUsage = {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      }
    }

    // For simple responses without tools, create a single step
    const formattedSteps = [
      {
        stepNumber: 1,
        text: finalText,
        toolCalls: [],
        toolResults: [],
        finishReason: finishReason || "stop",
      },
    ]

    console.log("Response processing completed successfully")

    return {
      text: finalText,
      usage: capturedUsage,
      steps: formattedSteps,
      finishReason: finishReason || "stop",
      toolCalls: [],
      toolResults: [],
    }
  } catch (error) {
    console.error("Error in generateAssistantResponse:", error)
    throw new Error(
      `Failed to generate assistant response: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
