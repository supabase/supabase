"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message as ChatMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  MessageBranch,
  MessageBranchContent,
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  GlobeIcon,
  MessageSquare,
  MicIcon,
  Minimize2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const suggestions = [
  "Show me my recent orders",
  "How many active users do we have?",
  "List all tasks due this week",
  "Summarize today's signups",
];

const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
];

type ComposerStatus = "ready" | "submitted" | "streaming" | "error";

type MessageMetadata = {
  sources?: { href: string; title: string }[];
  reasoning?: {
    content: string;
    duration: number;
  };
};

type ToolInvocationItem = NonNullable<ChatMessage["toolInvocations"]>[number];

const getMessageText = (content: ChatMessage["content"]) => {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
};

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ComposerStatus>("ready");
  const [model, setModel] = useState(models[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);

  const { messages, append, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (chatError) => {
      toast.error("Failed to send message", {
        description: chatError.message,
      });
      setStatus("error");
    },
  });

  useEffect(() => {
    if (isLoading) {
      setStatus("streaming");
      return;
    }

    if (!isLoading && status === "streaming") {
      setStatus("ready");
    }
  }, [isLoading, status]);

  useEffect(() => {
    if (!error && status === "error") {
      setStatus("ready");
    }
  }, [error, status]);

  const selectedModel = useMemo(
    () => models.find((entry) => entry.id === model),
    [model]
  );

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments) || isLoading) {
      return;
    }

    setStatus("submitted");

    if (message.files?.length) {
      toast.success("Files attached", {
        description: `${message.files.length} file(s) attached to message`,
      });
    }

    try {
      await append({
        role: "user",
        content: message.text?.trim() ?? "Sent with attachments",
        metadata: {
          model,
          useWebSearch,
          useMicrophone,
        },
      });
    } catch (submissionError) {
      console.error(submissionError);
      setStatus("error");
      return;
    }

    setText("");
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    setStatus("submitted");
    try {
      await append({ role: "user", content: suggestion });
    } catch (suggestionError) {
      console.error(suggestionError);
      setStatus("error");
    }
  };

  const renderToolInvocation = (tool: ToolInvocationItem) => {
    if (!tool) return null;

    return (
      <div
        key={tool.toolCallId}
        className="mt-3 rounded-md border bg-background/60 p-2 text-xs"
      >
        <div className="font-semibold">{tool.toolName}</div>
        {tool.state === "call" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running…
          </div>
        )}
        {tool.state === "result" && (
          <div className="text-muted-foreground">
            {typeof tool.result === "string"
              ? tool.result
              : JSON.stringify(tool.result, null, 2)}
          </div>
        )}
        {tool.state === "error" && (
          <div className="text-destructive">{tool.error}</div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-lg border bg-background shadow-2xl transition-all",
        isMinimized ? "h-14 w-80" : "h-[640px] w-[420px]"
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by MCP</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized((prev) => !prev)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-hidden">
            <Conversation className="flex h-full flex-col">
              <ConversationContent>
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <p>Hi! I'm your AI assistant.</p>
                    <p>I can help you query your data using natural language.</p>
                  </div>
                )}
                {messages.map((message) => {
                  const content = getMessageText(message.content);
                  const hasTools = Boolean(message.toolInvocations?.length);
                  const metadata = message.metadata as MessageMetadata | undefined;

                  return (
                    <MessageBranch defaultBranch={0} key={message.id}>
                      <MessageBranchContent>
                        <Message from={message.role === "user" ? "user" : "assistant"}>
                          <div>
                            {metadata?.sources?.length ? (
                              <Sources>
                                <SourcesTrigger
                                  count={metadata.sources.length}
                                />
                                <SourcesContent>
                                  {metadata.sources.map(
                                    (source: { href: string; title: string }) => (
                                      <Source
                                        key={source.href}
                                        href={source.href}
                                        title={source.title}
                                      />
                                    )
                                  )}
                                </SourcesContent>
                              </Sources>
                            ) : null}

                            {metadata?.reasoning && (
                              <Reasoning duration={metadata.reasoning.duration}>
                                <ReasoningTrigger />
                                <ReasoningContent>
                                  {metadata.reasoning.content}
                                </ReasoningContent>
                              </Reasoning>
                            )}

                            <MessageContent>
                              <MessageResponse>{content}</MessageResponse>
                            </MessageContent>

                            {hasTools && (
                              <div className="mt-2 space-y-2">
                                {message.toolInvocations?.map((tool) =>
                                  renderToolInvocation(tool)
                                )}
                              </div>
                            )}
                          </div>
                        </Message>
                      </MessageBranchContent>
                    </MessageBranch>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          <div className="grid shrink-0 gap-3 border-t bg-background/95 pt-3">
            <Suggestions className="px-4">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </Suggestions>
            <div className="px-4 pb-4">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputHeader>
                  <PromptInputAttachments>
                    {(attachment) => <PromptInputAttachment data={attachment} />}
                  </PromptInputAttachments>
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Ask me anything about your Supabase data..."
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <PromptInputButton
                      onClick={() => setUseMicrophone((prev) => !prev)}
                      variant={useMicrophone ? "default" : "ghost"}
                      type="button"
                    >
                      <MicIcon size={16} />
                      <span className="sr-only">Toggle microphone</span>
                    </PromptInputButton>
                    <PromptInputButton
                      onClick={() => setUseWebSearch((prev) => !prev)}
                      variant={useWebSearch ? "default" : "ghost"}
                      type="button"
                    >
                      <GlobeIcon size={16} />
                      <span className="sr-only">Toggle web search</span>
                    </PromptInputButton>
                    <ModelSelector
                      open={modelSelectorOpen}
                      onOpenChange={setModelSelectorOpen}
                    >
                      <ModelSelectorTrigger asChild>
                        <PromptInputButton type="button">
                          {selectedModel?.chefSlug && (
                            <ModelSelectorLogo
                              provider={selectedModel.chefSlug}
                            />
                          )}
                          {selectedModel?.name && (
                            <ModelSelectorName>
                              {selectedModel.name}
                            </ModelSelectorName>
                          )}
                        </PromptInputButton>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent>
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                          <ModelSelectorEmpty>
                            No models found.
                          </ModelSelectorEmpty>
                          {["OpenAI", "Anthropic"].map((chef) => (
                            <ModelSelectorGroup key={chef} heading={chef}>
                              {models
                                .filter((entry) => entry.chef === chef)
                                .map((entry) => (
                                  <ModelSelectorItem
                                    key={entry.id}
                                    value={entry.id}
                                    onSelect={() => {
                                      setModel(entry.id);
                                      setModelSelectorOpen(false);
                                    }}
                                  >
                                    <ModelSelectorLogo
                                      provider={entry.chefSlug}
                                    />
                                    <ModelSelectorName>
                                      {entry.name}
                                    </ModelSelectorName>
                                    <ModelSelectorLogoGroup>
                                      {entry.providers.map((provider) => (
                                        <ModelSelectorLogo
                                          key={provider}
                                          provider={provider}
                                        />
                                      ))}
                                    </ModelSelectorLogoGroup>
                                    {model === entry.id ? (
                                      <CheckIcon className="ml-auto h-4 w-4" />
                                    ) : (
                                      <div className="ml-auto h-4 w-4" />
                                    )}
                                  </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                          ))}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={status}
                    disabled={!text.trim() || isLoading}
                  />
                </PromptInputFooter>
              </PromptInput>
              {error && (
                <p className="mt-2 text-xs text-destructive">{error.message}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
